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

type FilterType = "all" | "positive" | "negative";

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
  } catch { return d; }
}

function initials(name: string) {
  return name.trim().split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?";
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 16 16"
          fill={s <= rating ? "#4ade80" : "none"}
          stroke={s <= rating ? "#4ade80" : "#374151"}
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
            fill={s <= (hov || value) ? "#4ade80" : "none"}
            stroke={s <= (hov || value) ? "#4ade80" : "#4b5563"}
            strokeWidth="1.5">
            <path d="M8 1l1.85 3.75L14 5.5l-3 2.92.71 4.13L8 10.4l-3.71 2.15.71-4.13L2 5.5l4.15-.75L8 1z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

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
    <div className="min-h-screen bg-[#111] flex items-center justify-center px-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <Icon name="Shield" size={15} className="text-black" />
          </div>
          <span className="font-semibold text-white">Модерация</span>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)}
            placeholder="Токен администратора"
            className="w-full bg-[#222] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors" />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={loading || !token}
            className="w-full bg-green-500 text-black font-semibold rounded-xl py-2.5 text-sm hover:bg-green-400 disabled:opacity-40 transition-colors">
            {loading ? "Проверка..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ReviewForm({ onSuccess, hasReview }: { onSuccess: () => void; hasReview: boolean }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ author: "", text: "", rating: 0 });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.author || !form.text || !form.rating) { setError("Заполните все поля"); return; }
    setLoading(true); setError("");
    const fp = getFingerprint();
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, fingerprint: fp }),
    });
    if (res.ok) { setSent(true); onSuccess(); }
    else { const d = await res.json(); setError(d.error || "Ошибка. Попробуйте снова."); }
    setLoading(false);
  }

  if (hasReview) {
    return (
      <div className="flex items-center gap-2 bg-[#1a2a1a] border border-green-800/40 rounded-xl px-4 py-3 text-sm text-green-400">
        <Icon name="Check" size={15} />
        Вы уже оставили отзыв — спасибо!
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full bg-green-500 text-black font-bold rounded-2xl py-4 text-base hover:bg-green-400 transition-colors">
        Оставить отзыв
      </button>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
      {sent ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Icon name="Check" size={22} className="text-green-400" />
          </div>
          <p className="font-semibold text-white text-sm">Отзыв отправлен!</p>
          <p className="text-xs text-gray-500 mt-1">Мы проверим его и опубликуем</p>
          <button onClick={() => { setSent(false); setOpen(false); }}
            className="mt-4 text-xs text-gray-400 hover:text-gray-200 transition-colors">Закрыть</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white text-sm">Ваш отзыв</p>
            <button type="button" onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300">
              <Icon name="X" size={16} />
            </button>
          </div>
          <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
            placeholder="Ваше имя"
            className="w-full bg-[#222] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors" />
          <div>
            <p className="text-xs text-gray-400 mb-2">Оценка</p>
            <StarPicker value={form.rating} onChange={(r) => setForm({ ...form, rating: r })} />
          </div>
          <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })}
            rows={3} placeholder="Ваш отзыв..."
            className="w-full bg-[#222] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors resize-none" />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-green-500 text-black font-semibold rounded-xl py-2.5 text-sm hover:bg-green-400 disabled:opacity-40 transition-colors">
            {loading ? "Отправка..." : "Отправить"}
          </button>
        </form>
      )}
    </div>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const isPositive = review.rating >= 4;
  return (
    <div className="bg-[#1a1a1a] border border-[#2d3a2d] rounded-2xl p-5 flex flex-col gap-3 hover:border-green-700/60 transition-all duration-200"
      style={{ animationDelay: `${index * 40}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#252525] flex items-center justify-center text-base font-bold text-gray-300 shrink-0 border border-[#333]">
            {initials(review.author)}
          </div>
          <div>
            <p className="font-semibold text-white text-sm leading-tight">{review.author}</p>
            <p className="text-xs text-gray-500 mt-0.5">{formatDate(review.date)}</p>
          </div>
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 ${isPositive ? "bg-green-500/15 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
          {isPositive ? <Icon name="Check" size={11} /> : <Icon name="Minus" size={11} />}
          {isPositive ? "Хорошо" : "Плохо"}
        </span>
      </div>
      <Stars rating={review.rating} />
      <p className="text-gray-300 text-sm leading-relaxed">{review.text}</p>
      {review.reply && (
        <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-3 mt-1">
          <p className="text-xs font-semibold text-green-400 mb-1.5">Ответ компании</p>
          <p className="text-sm text-gray-400 leading-relaxed">{review.reply.text}</p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status?: Review["status"] }) {
  if (!status) return null;
  const map = {
    approved: { label: "Опубликован", cls: "bg-green-500/15 text-green-400 border-green-500/20" },
    pending: { label: "На проверке", cls: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
    rejected: { label: "Отклонён", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  };
  const { label, cls } = map[status];
  return <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold border ${cls}`}>{label}</span>;
}

function AdminCard({ review, token, onRefresh, index }: { review: Review; token: string; onRefresh: () => void; index: number }) {
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
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
    <div className="bg-[#1a1a1a] border border-[#2d3a2d] rounded-2xl p-5 flex flex-col gap-3"
      style={{ animationDelay: `${index * 40}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#252525] flex items-center justify-center text-base font-bold text-gray-300 shrink-0 border border-[#333]">
            {initials(review.author)}
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{review.author}</p>
            <p className="text-xs text-gray-500 mt-0.5">{formatDate(review.date)}</p>
          </div>
        </div>
        <StatusBadge status={review.status} />
      </div>
      <Stars rating={review.rating} />
      <p className="text-gray-300 text-sm leading-relaxed">{review.text}</p>
      {review.reply && (
        <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-3">
          <p className="text-xs font-semibold text-green-400 mb-1">Ответ компании</p>
          <p className="text-sm text-gray-400">{review.reply.text}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        {review.status === "pending" && (<>
          <button onClick={() => moderate("approved")} disabled={!!loading}
            className="flex items-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 disabled:opacity-40 transition-colors">
            <Icon name="Check" size={13} />{loading === "approved" ? "..." : "Опубликовать"}
          </button>
          <button onClick={() => moderate("rejected")} disabled={!!loading}
            className="flex items-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-40 transition-colors">
            <Icon name="X" size={13} />{loading === "rejected" ? "..." : "Отклонить"}
          </button>
        </>)}
        {review.status === "approved" && !review.reply && (
          <button onClick={() => setShowReply(!showReply)}
            className="flex items-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl bg-[#252525] text-gray-300 border border-[#333] hover:border-green-700/50 transition-colors">
            <Icon name="MessageSquare" size={13} />Ответить
          </button>
        )}
        {review.status === "rejected" && (
          <button onClick={() => moderate("approved")} disabled={!!loading}
            className="flex items-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl bg-[#252525] text-gray-300 border border-[#333] hover:border-green-700/50 disabled:opacity-40 transition-colors">
            <Icon name="RotateCcw" size={13} />Восстановить
          </button>
        )}
      </div>
      {showReply && (
        <div className="space-y-2">
          <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
            rows={2} placeholder="Ответ от имени компании..."
            className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors resize-none" />
          <div className="flex gap-2">
            <button onClick={sendReply} disabled={!!loading || !replyText.trim()}
              className="flex-1 text-xs font-semibold py-2 px-3 rounded-xl bg-green-500 text-black hover:bg-green-400 disabled:opacity-40 transition-colors">
              {loading === "reply" ? "Отправка..." : "Опубликовать ответ"}
            </button>
            <button onClick={() => { setShowReply(false); setReplyText(""); }}
              className="text-xs font-semibold py-2 px-3 rounded-xl bg-[#252525] text-gray-300 border border-[#333] transition-colors">
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RatingSummary({ reviews, filter, onFilter }: { reviews: Review[]; filter: FilterType; onFilter: (f: FilterType) => void }) {
  const total = reviews.length;
  const positive = reviews.filter((r) => r.rating >= 4).length;
  const negative = reviews.filter((r) => r.rating < 4).length;
  const posPct = total ? Math.round((positive / total) * 100) : 0;

  const tabs: { key: FilterType; label: string; count: number; extra?: string }[] = [
    { key: "all", label: "Все отзывы", count: total },
    { key: "positive", label: "Позитивные", count: positive, extra: `${posPct}%` },
    { key: "negative", label: "Негативные", count: negative },
  ];

  return (
    <div className="flex gap-2.5 flex-wrap">
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onFilter(t.key)}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${filter === t.key ? "bg-green-500 text-black" : "bg-[#1a1a1a] border border-[#2a2a2a] text-white hover:border-green-700/50"}`}>
          {t.label}
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${filter === t.key ? "bg-black/20 text-black" : "bg-[#252525] text-gray-400"}`}>
            {t.count}
            {t.extra && <span className={`ml-1 ${filter === t.key ? "text-black/70" : "text-green-400"}`}>{t.extra}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

export default function Index() {
  const [tab, setTab] = useState<"public" | "admin">("public");
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [adminReviews, setAdminReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [adminFilter, setAdminFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [hasReview, setHasReview] = useState(false);

  const fetchPublic = useCallback(async () => {
    const res = await fetch(API);
    if (res.ok) setReviews(await res.json());
  }, []);

  const fetchAdmin = useCallback(async (token: string) => {
    const res = await fetch(`${API}?action=admin`, { headers: { "X-Admin-Token": token } });
    if (res.ok) setAdminReviews(await res.json());
  }, []);

  const checkHasReview = useCallback(async () => {
    try {
      const fp = getFingerprint();
      const res = await fetch(`${API}?action=check&fp=${fp}`);
      if (res.ok) { const d = await res.json(); setHasReview(d.has_review ?? false); }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPublic(), checkHasReview()]).finally(() => setLoading(false));
  }, [fetchPublic, checkHasReview]);

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
    <div className="min-h-screen bg-[#111] text-white">
      <header className="bg-[#111] border-b border-[#1f1f1f] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Icon name="Star" size={15} className="text-black" />
            </div>
            <span className="font-bold text-white text-base">Отзывы</span>
          </div>
          <div className="flex items-center gap-2">
            {tab === "public" && (
              <button onClick={() => { if (!adminToken) setShowAdminLogin(true); else setTab("admin"); }}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-400 transition-colors py-1.5 px-3 rounded-lg border border-[#2a2a2a] hover:border-green-700/50">
                <Icon name="Shield" size={13} />
                {adminToken && pendingCount > 0 && (
                  <span className="w-4 h-4 bg-amber-500 text-black rounded-full text-[10px] flex items-center justify-center font-bold">{pendingCount}</span>
                )}
                Модерация
              </button>
            )}
            {tab === "admin" && (
              <button onClick={() => setTab("public")}
                className="text-xs text-gray-400 hover:text-green-400 transition-colors py-1.5 px-3 rounded-lg border border-[#2a2a2a] hover:border-green-700/50">
                ← Витрина
              </button>
            )}
            {adminToken && tab === "admin" && (
              <button onClick={() => { setAdminToken(null); setTab("public"); setAdminReviews([]); }}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                Выйти
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {tab === "public" && (
          <>
            <ReviewForm onSuccess={() => { fetchPublic(); checkHasReview(); }} hasReview={hasReview} />
            <RatingSummary reviews={reviews} filter={filter} onFilter={setFilter} />
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map((i) => (
                  <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 space-y-3 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#252525]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-[#252525] rounded w-1/2" />
                        <div className="h-2 bg-[#252525] rounded w-1/3" />
                      </div>
                    </div>
                    <div className="h-2 bg-[#252525] rounded w-1/4" />
                    <div className="space-y-2">
                      <div className="h-2 bg-[#252525] rounded" />
                      <div className="h-2 bg-[#252525] rounded w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayed.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <Icon name="Inbox" size={36} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">Отзывов пока нет</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayed.map((r, i) => <ReviewCard key={r.id} review={r} index={i} />)}
              </div>
            )}
          </>
        )}

        {tab === "admin" && adminToken && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-bold text-white">Панель модерации</h2>
                <p className="text-xs text-gray-500 mt-0.5">Всего: {adminReviews.length} · Ожидают: {pendingCount}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-1">
                {([["all","Все"],["pending","На проверке"],["approved","Одобренные"],["rejected","Отклонённые"]] as const).map(([val,label]) => (
                  <button key={val} onClick={() => setAdminFilter(val)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${adminFilter === val ? "bg-green-500 text-black" : "text-gray-400 hover:text-white"}`}>
                    {label}
                    {val === "pending" && pendingCount > 0 && (
                      <span className="w-4 h-4 bg-amber-500 text-black rounded-full text-[10px] inline-flex items-center justify-center font-bold">{pendingCount}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            {adminDisplayed.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <Icon name="Inbox" size={36} className="mx-auto mb-3 opacity-40" />
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
