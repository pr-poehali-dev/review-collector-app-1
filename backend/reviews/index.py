"""
Управление отзывами: получение, создание, модерация и ответы компании.
Роутинг через query-параметр action: admin | moderate | reply | check
Один отзыв на пользователя — контроль через fingerprint браузера.
"""
import json
import os
import psycopg2

SCHEMA = "t_p75464024_review_collector_app"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}

def is_admin(headers):
    token = headers.get("X-Admin-Token", "") or headers.get("x-admin-token", "")
    return token == os.environ.get("ADMIN_TOKEN", "secret")

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    headers = event.get("headers") or {}
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    conn = get_conn()
    cur = conn.cursor()

    # GET ?action=check&fp=... — проверить, оставлял ли пользователь отзыв
    if method == "GET" and action == "check":
        fp = params.get("fp", "").strip()
        if not fp:
            cur.close(); conn.close()
            return ok({"has_review": False})
        cur.execute(f"SELECT id FROM {SCHEMA}.reviews WHERE fingerprint = %s LIMIT 1", (fp,))
        row = cur.fetchone()
        cur.close(); conn.close()
        return ok({"has_review": bool(row)})

    # GET ?action=admin — все отзывы для панели модерации
    if method == "GET" and action == "admin":
        if not is_admin(headers):
            cur.close(); conn.close()
            return err("Нет доступа", 403)
        cur.execute(f"""
            SELECT r.id, r.author, r.rating, r.text, r.status, r.created_at,
                   rp.id AS reply_id, rp.text AS reply_text, rp.created_at AS reply_at
            FROM {SCHEMA}.reviews r
            LEFT JOIN {SCHEMA}.replies rp ON rp.review_id = r.id
            ORDER BY r.created_at DESC
        """)
        rows = cur.fetchall()
        reviews = {}
        for row in rows:
            rid = row[0]
            if rid not in reviews:
                reviews[rid] = {
                    "id": rid, "author": row[1], "rating": row[2],
                    "text": row[3], "status": row[4], "date": row[5],
                    "reply": None
                }
            if row[6]:
                reviews[rid]["reply"] = {"id": row[6], "text": row[7], "created_at": row[8]}
        cur.close(); conn.close()
        return ok(list(reviews.values()))

    # GET / — публичный список одобренных с фильтром по оценке
    if method == "GET":
        rating = params.get("rating", "")
        where = ["r.status = 'approved'"]
        if rating and rating.isdigit():
            where.append(f"r.rating = {int(rating)}")
        cur.execute(f"""
            SELECT r.id, r.author, r.rating, r.text, r.created_at,
                   rp.id AS reply_id, rp.text AS reply_text, rp.created_at AS reply_at
            FROM {SCHEMA}.reviews r
            LEFT JOIN {SCHEMA}.replies rp ON rp.review_id = r.id
            WHERE {' AND '.join(where)}
            ORDER BY r.created_at DESC
        """)
        rows = cur.fetchall()
        reviews = {}
        for row in rows:
            rid = row[0]
            if rid not in reviews:
                reviews[rid] = {
                    "id": rid, "author": row[1], "rating": row[2],
                    "text": row[3], "date": row[4],
                    "reply": None
                }
            if row[5]:
                reviews[rid]["reply"] = {"id": row[5], "text": row[6], "created_at": row[7]}
        cur.close(); conn.close()
        return ok(list(reviews.values()))

    # POST / — создать отзыв (уходит на модерацию)
    if method == "POST" and action == "":
        author = (body.get("author") or "").strip()
        text = (body.get("text") or "").strip()
        rating = body.get("rating")
        fingerprint = (body.get("fingerprint") or "").strip()

        if not author or not text or not rating or not (1 <= int(rating) <= 5):
            cur.close(); conn.close()
            return err("Заполните все поля корректно")

        # Проверка: один отзыв на пользователя
        if fingerprint:
            cur.execute(f"SELECT id FROM {SCHEMA}.reviews WHERE fingerprint = %s LIMIT 1", (fingerprint,))
            if cur.fetchone():
                cur.close(); conn.close()
                return err("Вы уже оставляли отзыв ранее", 409)

        fp_value = fingerprint if fingerprint else None
        cur.execute(
            f"INSERT INTO {SCHEMA}.reviews (author, rating, text, source, fingerprint) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (author, int(rating), text, "Сайт", fp_value)
        )
        new_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return ok({"id": new_id, "message": "Отзыв отправлен на модерацию"}, 201)

    # PUT ?action=moderate — одобрить или отклонить
    if method == "PUT" and action == "moderate":
        if not is_admin(headers):
            cur.close(); conn.close()
            return err("Нет доступа", 403)
        review_id = body.get("id")
        status = body.get("status", "")
        if not review_id or status not in ("approved", "rejected"):
            cur.close(); conn.close()
            return err("Неверные параметры")
        cur.execute(f"UPDATE {SCHEMA}.reviews SET status = %s WHERE id = %s", (status, int(review_id)))
        conn.commit(); cur.close(); conn.close()
        return ok({"message": "Статус обновлён"})

    # POST ?action=reply — ответить от имени компании
    if method == "POST" and action == "reply":
        if not is_admin(headers):
            cur.close(); conn.close()
            return err("Нет доступа", 403)
        review_id = body.get("review_id")
        text = (body.get("text") or "").strip()
        if not review_id or not text:
            cur.close(); conn.close()
            return err("Заполните текст ответа")
        cur.execute(
            f"INSERT INTO {SCHEMA}.replies (review_id, text) VALUES (%s, %s) RETURNING id",
            (int(review_id), text)
        )
        new_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return ok({"id": new_id, "message": "Ответ добавлен"}, 201)

    cur.close(); conn.close()
    return err("Не найдено", 404)
