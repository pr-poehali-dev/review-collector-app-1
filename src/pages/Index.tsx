import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/2c0e2679-dd2c-4d97-80fb-4e7b2206505e";

interface Reply {
  id: number;
  text: string;
  created_at: string;
}

interface Review {
  id: number;
  author: string;
  rating: number;
  text: string;
  source: string;
  date: string;
  status?: "approved" | "pending" | "rejected";
  reply: Reply | null;
}

const SOURCES = ["Все", "Telegram", "VK", "WhatsApp", "Сайт"];
const RATINGS = ["Все", "5★", "4★", "3★"];

const AVATAR_BG: Record<string, string> = {
  А: "#e8f4f0", Б: "#f0e8f4", В: "#f4f0e8", Г: "#e8eef4", Д: "#f4e8e8",
  Е: "#eef4e8", Ж: "#f4ece8", З: "#e8f4f4", И: "#f0f4e8", К: "#f4e8f0",
  Л: "#e8e8f4", М: "#f4f4e8", Н: "#e8f4ec", О: "#f4ebe8", П: "#ebe8f4",
  Р: "#f4e8eb", С: "#e8f0f4", Т: "#f4f0ec", У: "#ecf4e8", Ф: "#f4ecf0",
};

function initials(name: string) {
  return name.trim().split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();
}

function StarRating({ rating, size = 15 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 16 16"
          fill={s <= rating ? "#111" : "none"}
          stroke={s <= rating ? "#111" : "#d1d5db"}
          strokeWidth="1.5">
          <path d="M8 1l1.85 3.75L14 5.5l-3 2.92.71 4.13L8 10.4l-3.71 2.15.71-4.13L2 5.5l4.15-.75L8 1z" />
        </svg>
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110">
          <svg width="22" height="22" viewBox="0 0 16 16"
            fill={s <= (hovered || value) ? "#111" : "none"}
            stroke={s <= (hovered || value) ? "#111" : "#d1d5db"}
            strokeWidth="1.5">
            <path d="M8 1l1.85 3.75L14 5.5l-3 2.92.71 4.13L8 10.4l-3.71 2.15.71-4.13L2 5.5l4.15-.75L8 1z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function AvatarCircle({ name }: { name: string }) {
  const ini = initials(name) || "?";
  const bg = AVATAR_BG[ini[0]] || "#f5f5f5";
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-gray-700 shrink-0"
      style={{ backgroundColor: bg }}>
      {ini}
    </div>
  );
}

function StatusBadge({ status }: { status?: Review["status"] }) {
  if (!status) return null;
  const map = {
    approved: { label: "Опубликован", cls: "bg-emerald-50 text-emerald-700" },
    pending: { label: "На проверке", cls: "bg-amber-50 text-amber-700" },
    rejected: { label: "Отклонён", cls: "bg-red-50 text-red-600" },
  };
  const { label, cls } = map[status];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

// ─── AdminLogin ──────────────────────────────────────────────────────────────

function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`${API}?action=admin`, {
      headers: { "X-Admin-Token": token },
    });
    if (res.ok) {
      onLogin(token);
    } else {
      setError("Неверный токен");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 font-golos flex items-center justify-center px-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-8 w-full max-w-sm animate-fade-in">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <Icon name="Shield" size={15} className="text-white" />
          </div>
          <span className="font-semibold text-gray-900">Панель администратора</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Токен доступа</label>
            <input type="password" value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Введите токен"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={loading || !token}
            className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-40 transition-colors">
            {loading ? "Проверка..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── ReviewForm ──────────────────────────────────────────────────────────────

function ReviewForm({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ author: "", text: "", rating: 0, source: "Сайт" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.author || !form.text || !form.rating) {
      setError("Заполните все поля и выберите оценку");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSent(true);
      setForm({ author: "", text: "", rating: 0, source: "Сайт" });
      onSuccess();
    } else {
      const d = await res.json();
      setError(d.error || "Ошибка. Попробуйте снова.");
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
        <Icon name="Plus" size={15} />
        Оставить отзыв
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 animate-scale-in w-full">
      {sent ? (
        <div className="text-center py-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Icon name="Check" size={18} className="text-emerald-600" />
          </div>
          <p className="font-semibold text-gray-900 text-sm">Отзыв отправлен!</p>
          <p className="text-xs text-gray-400 mt-1">Мы проверим его и опубликуем</p>
          <button onClick={() => { setSent(false); setOpen(false); }}
            className="mt-4 text-xs text-gray-500 hover:text-gray-700 transition-colors">
            Закрыть
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-gray-900 text-sm">Ваш отзыв</p>
            <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <Icon name="X" size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Ваше имя</label>
              <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
                placeholder="Иван Иванов"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Источник</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors bg-white">
                {["Сайт", "Telegram", "VK", "WhatsApp"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Оценка</label>
            <StarPicker value={form.rating} onChange={(r) => setForm({ ...form, rating: r })} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Текст отзыва</label>
            <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })}
              rows={3} placeholder="Поделитесь впечатлениями..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-40 transition-colors">
            {loading ? "Отправка..." : "Отправить"}
          </button>
        </form>
      )}
    </div>
  );
}

// ─── ReviewCard (public) ─────────────────────────────────────────────────────

function ReviewCard({ review, index }: { review: Review; index: number }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-4 hover:border-gray-200 hover:shadow-sm transition-all duration-200 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}>
      <div className="flex items-center gap-3">
        <AvatarCircle name={review.author} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-tight">{review.author}</p>
          <p className="text-xs text-gray-400 mt-0.5">{review.source} · {formatDate(review.date)}</p>
        </div>
      </div>
      <StarRating rating={review.rating} />
      <p className="text-gray-600 text-sm leading-relaxed">{review.text}</p>
      {review.reply && (
        <div className="border-l-2 border-gray-200 pl-4 mt-1">
          <p className="text-xs font-semibold text-gray-500 mb-1">Ответ компании</p>
          <p className="text-sm text-gray-600 leading-relaxed">{review.reply.text}</p>
        </div>
      )}
    </div>
  );
}

// ─── AdminCard ───────────────────────────────────────────────────────────────

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
    setLoading(null);
    onRefresh();
  }

  async function sendReply() {
    if (!replyText.trim()) return;
    setLoading("reply");
    await fetch(`${API}?action=reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ review_id: review.id, text: replyText }),
    });
    setReplyText("");
    setShowReply(false);
    setLoading(null);
    onRefresh();
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-4 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <AvatarCircle name={review.author} />
          <div>
            <p className="font-semibold text-gray-900 text-sm">{review.author}</p>
            <p className="text-xs text-gray-400 mt-0.5">{review.source} · {formatDate(review.date)}</p>
          </div>
        </div>
        <StatusBadge status={review.status} />
      </div>
      <StarRating rating={review.rating} />
      <p className="text-gray-600 text-sm leading-relaxed">{review.text}</p>

      {review.reply && (
        <div className="border-l-2 border-gray-200 pl-4">
          <p className="text-xs font-semibold text-gray-500 mb-1">Ответ компании</p>
          <p className="text-sm text-gray-600">{review.reply.text}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {review.status === "pending" && (
          <>
            <button onClick={() => moderate("approved")} disabled={!!loading}
              className="flex items-center gap-1.5 text-xs font-medium py-2 px-3 rounded-xl bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 transition-colors">
              <Icon name="Check" size={13} />
              {loading === "approved" ? "..." : "Опубликовать"}
            </button>
            <button onClick={() => moderate("rejected")} disabled={!!loading}
              className="flex items-center gap-1.5 text-xs font-medium py-2 px-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40 transition-colors">
              <Icon name="X" size={13} />
              {loading === "rejected" ? "..." : "Отклонить"}
            </button>
          </>
        )}
        {review.status === "approved" && !review.reply && (
          <button onClick={() => setShowReply(!showReply)}
            className="flex items-center gap-1.5 text-xs font-medium py-2 px-3 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
            <Icon name="MessageSquare" size={13} />
            Ответить
          </button>
        )}
        {review.status === "rejected" && (
          <button onClick={() => moderate("approved")} disabled={!!loading}
            className="flex items-center gap-1.5 text-xs font-medium py-2 px-3 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors">
            <Icon name="RotateCcw" size={13} />
            Восстановить
          </button>
        )}
      </div>

      {showReply && (
        <div className="animate-scale-in space-y-2">
          <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
            rows={2} placeholder="Ответ от имени компании..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none" />
          <div className="flex gap-2">
            <button onClick={sendReply} disabled={!!loading || !replyText.trim()}
              className="flex-1 text-xs font-medium py-2 px-3 rounded-xl bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 transition-colors">
              {loading === "reply" ? "Отправка..." : "Опубликовать ответ"}
            </button>
            <button onClick={() => { setShowReply(false); setReplyText(""); }}
              className="text-xs font-medium py-2 px-3 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors">
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RatingBlock ─────────────────────────────────────────────────────────────

function RatingBlock({ reviews }: { reviews: Review[] }) {
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const dist = [5, 4, 3, 2, 1].map((s) => {
    const count = reviews.filter((r) => r.rating === s).length;
    return { star: s, count, pct: reviews.length ? Math.round((count / reviews.length) * 100) : 0 };
  });
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
        <div className="text-center shrink-0">
          <div className="text-6xl font-bold text-gray-900 leading-none">{avg.toFixed(1)}</div>
          <div className="mt-2"><StarRating rating={Math.round(avg)} size={18} /></div>
          <p className="text-xs text-gray-400 mt-2">{reviews.length} отзывов</p>
        </div>
        <div className="flex-1 space-y-2.5 w-full">
          {dist.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-4 shrink-0">{star}</span>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="#1a1a1a" className="shrink-0">
                <path d="M8 1l1.85 3.75L14 5.5l-3 2.92.71 4.13L8 10.4l-3.71 2.15.71-4.13L2 5.5l4.15-.75L8 1z" />
              </svg>
              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                <div className="bg-gray-800 h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-gray-400 w-6 text-right shrink-0">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function Index() {
  const [tab, setTab] = useState<"public" | "admin">("public");
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [adminReviews, setAdminReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSource, setActiveSource] = useState("Все");
  const [activeRating, setActiveRating] = useState("Все");
  const [adminFilter, setAdminFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const fetchPublic = useCallback(async () => {
    const res = await fetch(API);
    if (res.ok) setReviews(await res.json());
  }, []);

  const fetchAdmin = useCallback(async (token: string) => {
    const res = await fetch(`${API}?action=admin`, { headers: { "X-Admin-Token": token } });
    if (res.ok) setAdminReviews(await res.json());
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPublic().finally(() => setLoading(false));
  }, [fetchPublic]);

  useEffect(() => {
    if (adminToken) fetchAdmin(adminToken);
  }, [adminToken, fetchAdmin]);

  function handleAdminLogin(token: string) {
    setAdminToken(token);
    setShowAdminLogin(false);
    setTab("admin");
  }

  const pendingCount = adminReviews.filter((r) => r.status === "pending").length;

  const publicFiltered = reviews.filter((r) => {
    if (activeSource !== "Все" && r.source !== activeSource) return false;
    if (activeRating !== "Все" && r.rating !== parseInt(activeRating)) return false;
    return true;
  });

  const adminFiltered = adminReviews.filter((r) =>
    adminFilter === "all" ? true : r.status === adminFilter
  );

  if (showAdminLogin) {
    return <AdminLogin onLogin={handleAdminLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-golos">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <Icon name="MessageSquare" size={15} className="text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-base">Отзывы</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              <button onClick={() => setTab("public")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${tab === "public" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                Витрина
              </button>
              <button onClick={() => { if (!adminToken) setShowAdminLogin(true); else setTab("admin"); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${tab === "admin" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {adminToken && pendingCount > 0 && (
                  <span className="w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">{pendingCount}</span>
                )}
                Модерация
              </button>
            </div>
            {adminToken && (
              <button onClick={() => { setAdminToken(null); setTab("public"); setAdminReviews([]); }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Выйти
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* ── Public tab ── */}
        {tab === "public" && (
          <>
            <RatingBlock reviews={reviews} />

            <div className="flex flex-col gap-6">
              <ReviewForm onSuccess={fetchPublic} />

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex bg-white border border-gray-100 rounded-xl p-1 gap-1 flex-wrap">
                  {SOURCES.map((s) => (
                    <button key={s} onClick={() => setActiveSource(s)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${activeSource === s ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex bg-white border border-gray-100 rounded-xl p-1 gap-1">
                  {RATINGS.map((r) => (
                    <button key={r} onClick={() => setActiveRating(r)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${activeRating === r ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-3 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                        <div className="h-2 bg-gray-100 rounded w-1/3" />
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded w-1/4" />
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-100 rounded" />
                      <div className="h-2 bg-gray-100 rounded w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : publicFiltered.length === 0 ? (
              <div className="text-center py-20 text-gray-400 animate-fade-in">
                <Icon name="Inbox" size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Отзывов пока нет</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {publicFiltered.map((r, i) => <ReviewCard key={r.id} review={r} index={i} />)}
              </div>
            )}
          </>
        )}

        {/* ── Admin tab ── */}
        {tab === "admin" && adminToken && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-semibold text-gray-900">Панель модерации</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Всего: {adminReviews.length} · Ожидают: {pendingCount}
                </p>
              </div>
              <div className="flex bg-white border border-gray-100 rounded-xl p-1 gap-1 flex-wrap">
                {([["all", "Все"], ["pending", "На проверке"], ["approved", "Одобренные"], ["rejected", "Отклонённые"]] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setAdminFilter(val)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${adminFilter === val ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
                    {label}
                    {val === "pending" && pendingCount > 0 && (
                      <span className="w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] inline-flex items-center justify-center font-bold">{pendingCount}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {adminFiltered.length === 0 ? (
              <div className="text-center py-20 text-gray-400 animate-fade-in">
                <Icon name="Inbox" size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Отзывов нет</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminFiltered.map((r, i) => (
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
