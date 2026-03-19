import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/2c0e2679-dd2c-4d97-80fb-4e7b2206505e";

function getFingerprint(): string {
  const key = "rv_fp";
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, fp);
  }
  return fp;
}

interface Reply { id: number; text: string; created_at: string; }
interface Review {
  id: number;
  author: string;
  rating: number;
  text: string;
  date: string;
  status?: "approved" | "pending" | "rejected";
  reply: Reply | null;
}
interface MyReview { id: number; author: string; rating: number; text: string; status: string; }

type FilterType = "all" | "positive" | "negative";

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
  } catch { return d; }
}

function initials(name: string) {
  return name.trim().split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?";
}

// ─── Stars ───────────────────────────────────────────────────────────────────

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 16 16"
          fill={s <= rating ? "#16a34a" : "none"}
          stroke={s <= rating ? "#16a34a" : "#d1d5db"}
          strokeWidth="1.5">
          <path d="M8 1l1.85 3.75L14 5.5l-3 2.92.71 4.13L8 10.4l-3.71 2.15.71-4.13L2 5.5l4.15-.75L8 1z" />
        </svg>
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hov, setHov] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((s) => (
        <button key={s} type="button"
          onMouseEnter={() => setHov(s)} onMouseLeave={() => setHov(0)}
          onClick={() => onChange(s)} className="transition-transform hover:scale-110">
          <svg width="26" height="26" viewBox="0 0 16 16"
            fill={s <= (hov || value) ? "#16a34a" : "none"}
            stroke={s <= (hov || value) ? "#16a34a" : "#9ca3af"}
            strokeWidth="1.5">
            <path d="M8 1l1.85 3.75L14 5.5l-3 2.92.71 4.13L8 10.4l-3.71 2.15.71-4.13L2 5.5l4.15-.75L8 1z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ─── AdminLogin ───────────────────────────────────────────────────────────────

function AdminLogin({ onLogin }: { onLogin: (t: string) => void }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch(`${API}?action=admin`, { headers: { "X-Admin-Token": token } });
    if (res.ok) onLogin(token);
    else setError("Неверный токен");
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm shadow-sm">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
            <Icon name="Shield" size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Панель модерации</p>
            <p className="text-xs text-gray-400">Только для администраторов</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)}
            placeholder="Секретный токен"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all" />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={loading || !token}
            className="w-full bg-green-600 text-white font-semibold rounded-xl py-2.5 text-sm hover:bg-green-700 disabled:opacity-40 transition-colors">
            {loading ? "Проверка..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── MyReviewBanner (уже оставил отзыв) ──────────────────────────────────────

function MyReviewBanner({ myReview, onEdit, onDelete }: {
  myReview: MyReview;
  onEdit: (r: MyReview) => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const statusMap: Record<string, { label: string; cls: string }> = {
    approved: { label: "Опубликован", cls: "text-green-600 bg-green-50 border-green-200" },
    pending: { label: "На проверке", cls: "text-amber-600 bg-amber-50 border-amber-200" },
    rejected: { label: "Отклонён", cls: "text-red-500 bg-red-50 border-red-200" },
  };
  const st = statusMap[myReview.status] ?? statusMap["pending"];

  async function handleDelete() {
    setDeleting(true);
    const fp = getFingerprint();
    await fetch(`${API}?action=delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: myReview.id, fingerprint: fp }),
    });
    setDeleting(false);
    onDelete();
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Ваш отзыв</p>
          <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border mt-1 ${st.cls}`}>
            {st.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onEdit(myReview)}
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors">
            <Icon name="Pencil" size={13} /> Изменить
          </button>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors">
              <Icon name="Trash2" size={13} /> Удалить
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button onClick={handleDelete} disabled={deleting}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 transition-colors">
                {deleting ? "..." : "Да, удалить"}
              </button>
              <button onClick={() => setConfirmDelete(false)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>
      <Stars rating={myReview.rating} />
      <p className="text-gray-600 text-sm leading-relaxed mt-2">{myReview.text}</p>
    </div>
  );
}

// ─── ReviewForm (создание / редактирование) ───────────────────────────────────

function ReviewForm({ onSuccess, onCancel, editMode, initial }: {
  onSuccess: () => void;
  onCancel?: () => void;
  editMode?: MyReview;
  initial?: boolean;
}) {
  const [form, setForm] = useState({
    author: editMode?.author ?? "",
    text: editMode?.text ?? "",
    rating: editMode?.rating ?? 0,
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.author || !form.text || !form.rating) { setError("Заполните все поля"); return; }
    setLoading(true); setError("");
    const fp = getFingerprint();

    if (editMode) {
      const res = await fetch(`${API}?action=edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editMode.id, fingerprint: fp, text: form.text, rating: form.rating }),
      });
      if (res.ok) { setSent(true); onSuccess(); }
      else { const d = await res.json(); setError(d.error || "Ошибка"); }
    } else {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, fingerprint: fp }),
      });
      if (res.ok) { setSent(true); onSuccess(); }
      else { const d = await res.json(); setError(d.error || "Ошибка. Попробуйте снова."); }
    }
    setLoading(false);
  }

  if (sent && !editMode) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-center">
        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Icon name="Check" size={22} className="text-green-600" />
        </div>
        <p className="font-semibold text-gray-900 text-sm">Отзыв отправлен!</p>
        <p className="text-xs text-gray-400 mt-1">Мы проверим его и опубликуем</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-900 text-sm">
            {editMode ? "Редактировать отзыв" : "Оставить отзыв"}
          </p>
          {(onCancel || editMode) && (
            <button type="button" onClick={onCancel}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <Icon name="X" size={14} className="text-gray-500" />
            </button>
          )}
        </div>

        {!editMode && (
          <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
            placeholder="Ваше имя"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all" />
        )}

        <div>
          <p className="text-xs text-gray-400 mb-2 font-medium">Оценка</p>
          <StarPicker value={form.rating} onChange={(r) => setForm({ ...form, rating: r })} />
        </div>

        <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })}
          rows={3} placeholder="Расскажите о своём опыте..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all resize-none" />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className="flex-1 bg-green-600 text-white font-semibold rounded-xl py-2.5 text-sm hover:bg-green-700 disabled:opacity-40 transition-colors">
            {loading ? "Отправка..." : editMode ? "Сохранить" : "Отправить"}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel}
              className="px-4 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
              Отмена
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// ─── ReviewCard ───────────────────────────────────────────────────────────────

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const isPositive = review.rating >= 4;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 hover:border-green-200 hover:shadow-sm transition-all duration-200"
      style={{ animationDelay: `${index * 40}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-sm font-bold text-green-700 shrink-0">
            {initials(review.author)}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">{review.author}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(review.date)}</p>
          </div>
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${isPositive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {isPositive ? <Icon name="ThumbsUp" size={11} /> : <Icon name="ThumbsDown" size={11} />}
          {isPositive ? "Хорошо" : "Плохо"}
        </span>
      </div>
      <Stars rating={review.rating} />
      <p className="text-gray-600 text-sm leading-relaxed">{review.text}</p>
      {review.reply && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-3.5">
          <p className="text-xs font-bold text-green-700 mb-1.5 flex items-center gap-1">
            <Icon name="MessageSquare" size={12} /> Ответ компании
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">{review.reply.text}</p>
        </div>
      )}
    </div>
  );
}

// ─── AdminCard ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: Review["status"] }) {
  if (!status) return null;
  const map = {
    approved: { label: "Опубликован", cls: "bg-green-50 text-green-700 border-green-200" },
    pending: { label: "На проверке", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    rejected: { label: "Отклонён", cls: "bg-red-50 text-red-500 border-red-200" },
  };
  const { label, cls } = map[status];
  return <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${cls}`}>{label}</span>;
}

function AdminCard({ review, token, onRefresh, index }: { review: Review; token: string; onRefresh: () => void; index: number }) {
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  async function moderate(status: "approved" | "rejected") {
    setLoading(status);
    await fetch(`${API}?action=moderate`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ id: review.id, status }),
    });
    setLoading(null); onRefresh();
  }

  async function adminDelete() {
    setLoading("delete");
    await fetch(`${API}?action=admin_delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ id: review.id }),
    });
    setLoading(null); onRefresh();
  }

  async function sendReply() {
    if (!replyText.trim()) return;
    setLoading("reply");
    await fetch(`${API}?action=reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ review_id: review.id, text: replyText }),
    });
    setReplyText(""); setShowReply(false); setLoading(null); onRefresh();
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 hover:border-gray-200 transition-all"
      style={{ animationDelay: `${index * 40}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-sm font-bold text-green-700 shrink-0">
            {initials(review.author)}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{review.author}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(review.date)}</p>
          </div>
        </div>
        <StatusBadge status={review.status} />
      </div>
      <Stars rating={review.rating} />
      <p className="text-gray-600 text-sm leading-relaxed">{review.text}</p>

      {review.reply && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-3">
          <p className="text-xs font-bold text-green-700 mb-1">Ответ компании</p>
          <p className="text-sm text-gray-600">{review.reply.text}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-50">
        {review.status === "pending" && (<>
          <button onClick={() => moderate("approved")} disabled={!!loading}
            className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 transition-colors">
            <Icon name="Check" size={13} />{loading === "approved" ? "..." : "Опубликовать"}
          </button>
          <button onClick={() => moderate("rejected")} disabled={!!loading}
            className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 disabled:opacity-40 transition-colors">
            <Icon name="X" size={13} />{loading === "rejected" ? "..." : "Отклонить"}
          </button>
        </>)}
        {review.status === "approved" && !review.reply && (
          <button onClick={() => setShowReply(!showReply)}
            className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg border border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors">
            <Icon name="MessageSquare" size={13} />Ответить
          </button>
        )}
        {review.status === "rejected" && (
          <button onClick={() => moderate("approved")} disabled={!!loading}
            className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg border border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600 disabled:opacity-40 transition-colors">
            <Icon name="RotateCcw" size={13} />Восстановить
          </button>
        )}

        {/* Удаление — доступно всегда */}
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} disabled={!!loading}
            className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 disabled:opacity-40 transition-colors ml-auto">
            <Icon name="Trash2" size={13} />Удалить
          </button>
        ) : (
          <div className="flex items-center gap-1.5 ml-auto">
            <button onClick={adminDelete} disabled={!!loading}
              className="text-xs font-semibold py-1.5 px-3 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 transition-colors">
              {loading === "delete" ? "..." : "Да, удалить"}
            </button>
            <button onClick={() => setConfirmDelete(false)}
              className="text-xs py-1.5 px-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              Отмена
            </button>
          </div>
        )}
      </div>

      {showReply && (
        <div className="space-y-2 bg-green-50 rounded-xl p-4 border border-green-100">
          <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
            rows={2} placeholder="Ответ от имени компании..."
            className="w-full border border-green-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-500 transition-colors resize-none" />
          <div className="flex gap-2">
            <button onClick={sendReply} disabled={!!loading || !replyText.trim()}
              className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 transition-colors">
              {loading === "reply" ? "Отправка..." : "Опубликовать ответ"}
            </button>
            <button onClick={() => { setShowReply(false); setReplyText(""); }}
              className="text-xs font-semibold py-2 px-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RatingSummary ────────────────────────────────────────────────────────────

function RatingSummary({ reviews, filter, onFilter }: { reviews: Review[]; filter: FilterType; onFilter: (f: FilterType) => void }) {
  const total = reviews.length;
  const positive = reviews.filter((r) => r.rating >= 4).length;
  const negative = reviews.filter((r) => r.rating < 4).length;
  const posPct = total ? Math.round((positive / total) * 100) : 0;

  const tabs: { key: FilterType; label: string; count: number; pct?: string }[] = [
    { key: "all", label: "Все отзывы", count: total },
    { key: "positive", label: "Позитивные", count: positive, pct: `${posPct}%` },
    { key: "negative", label: "Негативные", count: negative },
  ];

  return (
    <div className="flex gap-2">
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onFilter(t.key)}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${filter === t.key ? "bg-green-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-green-300"}`}>
          <span>{t.label}</span>
          <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${filter === t.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
            {t.count}
            {t.pct && <span className={filter === t.key ? "text-white/70" : "text-green-600"}>{t.pct}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Index() {
  const [tab, setTab] = useState<"public" | "admin">("public");
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [adminReviews, setAdminReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [adminFilter, setAdminFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [myReview, setMyReview] = useState<MyReview | null>(null);
  const [editing, setEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchPublic = useCallback(async () => {
    const res = await fetch(API);
    if (res.ok) setReviews(await res.json());
  }, []);

  const fetchAdmin = useCallback(async (token: string) => {
    const res = await fetch(`${API}?action=admin`, { headers: { "X-Admin-Token": token } });
    if (res.ok) setAdminReviews(await res.json());
  }, []);

  const checkMyReview = useCallback(async () => {
    try {
      const fp = getFingerprint();
      const res = await fetch(`${API}?action=check&fp=${fp}`);
      if (res.ok) {
        const d = await res.json();
        setMyReview(d.has_review ? d.review : null);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPublic(), checkMyReview()]).finally(() => setLoading(false));
  }, [fetchPublic, checkMyReview]);

  useEffect(() => {
    if (adminToken) fetchAdmin(adminToken);
  }, [adminToken, fetchAdmin]);

  function handleAdminLogin(token: string) {
    setAdminToken(token); setShowAdminLogin(false); setTab("admin");
  }

  const pendingCount = adminReviews.filter((r) => r.status === "pending").length;

  const displayed = reviews.filter((r) => {
    if (filter === "positive") return r.rating >= 4;
    if (filter === "negative") return r.rating < 4;
    return true;
  });

  const adminDisplayed = adminReviews.filter((r) =>
    adminFilter === "all" ? true : r.status === adminFilter
  );

  if (showAdminLogin) return <AdminLogin onLogin={handleAdminLogin} />;

  return (
    <div className="min-h-screen bg-gray-50 font-golos">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Icon name="Star" size={15} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">Отзывы</span>
          </div>
          <div className="flex items-center gap-2">
            {tab === "public" && (
              <button onClick={() => { if (!adminToken) setShowAdminLogin(true); else setTab("admin"); }}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors">
                <Icon name="Shield" size={13} />
                Модерация
                {adminToken && pendingCount > 0 && (
                  <span className="w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">{pendingCount}</span>
                )}
              </button>
            )}
            {tab === "admin" && (
              <>
                <button onClick={() => setTab("public")}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors">
                  ← Витрина
                </button>
                <button onClick={() => { setAdminToken(null); setTab("public"); setAdminReviews([]); }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  Выйти
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* ── Public ── */}
        {tab === "public" && (
          <>
            {/* Мой отзыв / форма */}
            {myReview && !editing && (
              <MyReviewBanner
                myReview={myReview}
                onEdit={(r) => setEditing(true)}
                onDelete={() => { setMyReview(null); fetchPublic(); }}
              />
            )}
            {myReview && editing && (
              <ReviewForm
                editMode={myReview}
                onSuccess={() => { setEditing(false); checkMyReview(); fetchPublic(); }}
                onCancel={() => setEditing(false)}
              />
            )}
            {!myReview && !showForm && (
              <button onClick={() => setShowForm(true)}
                className="w-full bg-green-600 text-white font-bold rounded-2xl py-4 text-base hover:bg-green-700 transition-colors shadow-sm shadow-green-100">
                Оставить отзыв
              </button>
            )}
            {!myReview && showForm && (
              <ReviewForm
                onSuccess={() => { setShowForm(false); checkMyReview(); fetchPublic(); }}
                onCancel={() => setShowForm(false)}
              />
            )}

            {/* Фильтры в одну строку */}
            <RatingSummary reviews={reviews} filter={filter} onFilter={setFilter} />

            {/* Список */}
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map((i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                        <div className="h-2 bg-gray-100 rounded w-1/3" />
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded w-1/4" />
                    <div className="space-y-1.5">
                      <div className="h-2 bg-gray-100 rounded" />
                      <div className="h-2 bg-gray-100 rounded w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayed.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Icon name="Inbox" size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Отзывов пока нет</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayed.map((r, i) => <ReviewCard key={r.id} review={r} index={i} />)}
              </div>
            )}
          </>
        )}

        {/* ── Admin ── */}
        {tab === "admin" && adminToken && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-bold text-gray-900">Панель модерации</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Всего: {adminReviews.length} · Ожидают: <span className="text-amber-600 font-semibold">{pendingCount}</span>
                </p>
              </div>
              <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm flex-wrap">
                {([["all","Все"],["pending","На проверке"],["approved","Опубликованные"],["rejected","Отклонённые"]] as const).map(([val,label]) => (
                  <button key={val} onClick={() => setAdminFilter(val)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${adminFilter === val ? "bg-green-600 text-white" : "text-gray-500 hover:text-gray-800"}`}>
                    {label}
                    {val === "pending" && pendingCount > 0 && (
                      <span className="w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] inline-flex items-center justify-center font-bold">{pendingCount}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {adminDisplayed.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Icon name="Inbox" size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Отзывов нет</p>
              </div>
            ) : (
              <div className="space-y-3">
                {adminDisplayed.map((r, i) => (
                  <AdminCard key={r.id} review={r} token={adminToken} onRefresh={() => fetchAdmin(adminToken)} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
