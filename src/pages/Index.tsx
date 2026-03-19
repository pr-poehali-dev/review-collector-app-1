import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/2c0e2679-dd2c-4d97-80fb-4e7b2206505e";

// ─── Fingerprint ─────────────────────────────────────────────────────────────

function getFingerprint(): string {
  const key = "review_fp";
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem(key, fp);
  }
  return fp;
}

// ─── Types ───────────────────────────────────────────────────────────────────

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
  date: string;
  status?: "approved" | "pending" | "rejected";
  reply: Reply | null;
}

const RATINGS = ["Все", "5★", "4★", "3★", "2★", "1★"];

const AVATAR_COLORS = [
  ["#dcfce7", "#166534"],
  ["#d1fae5", "#065f46"],
  ["#ecfdf5", "#047857"],
  ["#f0fdf4", "#15803d"],
  ["#bbf7d0", "#166534"],
];

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function initials(name: string) {
  return name.trim().split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

// ─── Stars ───────────────────────────────────────────────────────────────────

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
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
  const [hovered, setHovered] = useState(0);
  const labels = ["Ужасно", "Плохо", "Нормально", "Хорошо", "Отлично"];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button"
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(s)}
            className="transition-transform hover:scale-110 active:scale-95">
            <svg width="28" height="28" viewBox="0 0 16 16"
              fill={s <= (hovered || value) ? "#16a34a" : "none"}
              stroke={s <= (hovered || value) ? "#16a34a" : "#d1d5db"}
              strokeWidth="1.5">
              <path d="M8 1l1.85 3.75L14 5.5l-3 2.92.71 4.13L8 10.4l-3.71 2.15.71-4.13L2 5.5l4.15-.75L8 1z" />
            </svg>
          </button>
        ))}
      </div>
      {(hovered || value) > 0 && (
        <p className="text-xs text-green-600 font-medium">{labels[(hovered || value) - 1]}</p>
      )}
    </div>
  );
}

function AvatarCircle({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const ini = initials(name) || "?";
  const [bg, fg] = getAvatarColor(name);
  const cls = size === "sm" ? "w-8 h-8 text-xs" : "w-11 h-11 text-sm";
  return (
    <div className={`${cls} rounded-full flex items-center justify-center font-bold shrink-0`}
      style={{ backgroundColor: bg, color: fg }}>
      {ini}
    </div>
  );
}

function StatusBadge({ status }: { status?: Review["status"] }) {
  if (!status) return null;
  const map = {
    approved: { label: "Опубликован", cls: "bg-green-50 text-green-700 border-green-200" },
    pending: { label: "На проверке", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    rejected: { label: "Отклонён", cls: "bg-red-50 text-red-600 border-red-200" },
  };
  const { label, cls } = map[status];
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${cls}`}>{label}</span>;
}

// ─── AdminLogin ───────────────────────────────────────────────────────────────

function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`${API}?action=admin`, { headers: { "X-Admin-Token": token } });
    if (res.ok) { onLogin(token); } else { setError("Неверный токен доступа"); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-green-100 p-10 w-full max-w-sm animate-fade-in">
        <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
          <Icon name="Shield" size={24} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Вход для администратора</h2>
        <p className="text-sm text-gray-400 text-center mb-6">Введите токен для доступа к панели</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)}
            placeholder="Секретный токен"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all" />
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <button type="submit" disabled={loading || !token}
            className="w-full bg-green-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-green-700 disabled:opacity-40 transition-colors">
            {loading ? "Проверка..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── ReviewForm ───────────────────────────────────────────────────────────────

function ReviewForm({ onSuccess, hasReview }: { onSuccess: () => void; hasReview: boolean }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ author: "", text: "", rating: 0 });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.author || !form.text || !form.rating) {
      setError("Заполните все поля и поставьте оценку");
      return;
    }
    setLoading(true);
    setError("");
    const fp = getFingerprint();
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, fingerprint: fp }),
    });
    const data = await res.json();
    if (res.ok) {
      setSent(true);
      setForm({ author: "", text: "", rating: 0 });
      onSuccess();
    } else {
      setError(data.error || "Ошибка. Попробуйте снова.");
    }
    setLoading(false);
  }

  if (hasReview) {
    return (
      <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-2xl px-5 py-3.5">
        <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
          <Icon name="Check" size={14} className="text-green-600" />
        </div>
        <p className="text-sm text-green-700 font-medium">Вы уже оставили отзыв — спасибо!</p>
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:bg-green-700 active:scale-95 transition-all shadow-sm shadow-green-200">
        <Icon name="PenLine" size={16} />
        Написать отзыв
      </button>
    );
  }

  return (
    <div className="bg-white border border-green-100 rounded-3xl p-7 shadow-sm animate-scale-in">
      {sent ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="Check" size={28} className="text-green-600" />
          </div>
          <p className="font-bold text-gray-900 text-lg">Отзыв отправлен!</p>
          <p className="text-sm text-gray-400 mt-1.5">Он появится после проверки модератором</p>
          <button onClick={() => { setSent(false); setOpen(false); }}
            className="mt-5 text-sm text-green-600 hover:text-green-700 font-medium transition-colors">
            Закрыть
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-base">Ваш отзыв</h3>
            <button type="button" onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <Icon name="X" size={15} className="text-gray-500" />
            </button>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Ваше имя</label>
            <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
              placeholder="Как вас зовут?"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Оценка</label>
            <StarPicker value={form.rating} onChange={(r) => setForm({ ...form, rating: r })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Расскажите подробнее</label>
            <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })}
              rows={4} placeholder="Что понравилось или что можно улучшить?"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all resize-none" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading}
              className="flex-1 bg-green-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-green-700 disabled:opacity-40 transition-colors">
              {loading ? "Отправка..." : "Опубликовать"}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="px-5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
              Отмена
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── ReviewCard ───────────────────────────────────────────────────────────────

function ReviewCard({ review, index }: { review: Review; index: number }) {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col gap-4 hover:border-green-200 hover:shadow-md hover:shadow-green-50 transition-all duration-300 animate-fade-in"
      style={{ animationDelay: `${index * 40}ms` }}>
      <div className="flex items-start gap-3">
        <AvatarCircle name={review.author} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm">{review.author}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(review.date)}</p>
        </div>
        <StarRating rating={review.rating} size={14} />
      </div>
      <p className="text-gray-600 text-sm leading-relaxed">{review.text}</p>
      {review.reply && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-green-700 mb-1.5 flex items-center gap-1.5">
            <Icon name="MessageSquare" size={12} />
            Ответ компании
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">{review.reply.text}</p>
        </div>
      )}
    </div>
  );
}

// ─── AdminCard ────────────────────────────────────────────────────────────────

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
    <div className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col gap-4 animate-fade-in"
      style={{ animationDelay: `${index * 40}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <AvatarCircle name={review.author} />
          <div>
            <p className="font-bold text-gray-900 text-sm">{review.author}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(review.date)}</p>
          </div>
        </div>
        <StatusBadge status={review.status} />
      </div>
      <StarRating rating={review.rating} />
      <p className="text-gray-600 text-sm leading-relaxed">{review.text}</p>

      {review.reply && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-green-700 mb-1.5">Ответ компании</p>
          <p className="text-sm text-gray-600">{review.reply.text}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-50">
        {review.status === "pending" && (
          <>
            <button onClick={() => moderate("approved")} disabled={!!loading}
              className="flex items-center gap-1.5 text-xs font-semibold py-2 px-4 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 transition-colors">
              <Icon name="Check" size={13} />
              {loading === "approved" ? "..." : "Опубликовать"}
            </button>
            <button onClick={() => moderate("rejected")} disabled={!!loading}
              className="flex items-center gap-1.5 text-xs font-semibold py-2 px-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40 transition-colors border border-red-100">
              <Icon name="X" size={13} />
              {loading === "rejected" ? "..." : "Отклонить"}
            </button>
          </>
        )}
        {review.status === "approved" && !review.reply && (
          <button onClick={() => setShowReply(!showReply)}
            className="flex items-center gap-1.5 text-xs font-semibold py-2 px-4 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors border border-green-100">
            <Icon name="MessageSquare" size={13} />
            Ответить
          </button>
        )}
        {review.status === "rejected" && (
          <button onClick={() => moderate("approved")} disabled={!!loading}
            className="flex items-center gap-1.5 text-xs font-semibold py-2 px-4 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 transition-colors">
            <Icon name="RotateCcw" size={13} />
            Восстановить
          </button>
        )}
      </div>

      {showReply && (
        <div className="animate-scale-in space-y-3 bg-green-50 rounded-2xl p-4 border border-green-100">
          <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
            rows={2} placeholder="Ответ от имени компании..."
            className="w-full border border-green-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 transition-colors resize-none bg-white" />
          <div className="flex gap-2">
            <button onClick={sendReply} disabled={!!loading || !replyText.trim()}
              className="flex-1 text-xs font-semibold py-2 px-3 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 transition-colors">
              {loading === "reply" ? "Отправка..." : "Опубликовать ответ"}
            </button>
            <button onClick={() => { setShowReply(false); setReplyText(""); }}
              className="text-xs font-semibold py-2 px-3 rounded-xl bg-white text-gray-500 hover:bg-gray-100 transition-colors border border-gray-200">
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RatingBlock ──────────────────────────────────────────────────────────────

function RatingBlock({ reviews }: { reviews: Review[] }) {
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const dist = [5, 4, 3, 2, 1].map((s) => {
    const count = reviews.filter((r) => r.rating === s).length;
    return { star: s, count, pct: reviews.length ? Math.round((count / reviews.length) * 100) : 0 };
  });
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
        <div className="text-center shrink-0 min-w-[120px]">
          <div className="text-7xl font-black text-gray-900 leading-none tracking-tight">{avg.toFixed(1)}</div>
          <div className="mt-3 flex justify-center">
            <StarRating rating={Math.round(avg)} size={20} />
          </div>
          <p className="text-xs text-gray-400 mt-2 font-medium">{reviews.length} {reviews.length === 1 ? "отзыв" : reviews.length < 5 ? "отзыва" : "отзывов"}</p>
        </div>
        <div className="flex-1 space-y-2 w-full">
          {dist.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-3 shrink-0 font-medium">{star}</span>
              <svg width="11" height="11" viewBox="0 0 16 16" fill="#16a34a" className="shrink-0">
                <path d="M8 1l1.85 3.75L14 5.5l-3 2.92.71 4.13L8 10.4l-3.71 2.15.71-4.13L2 5.5l4.15-.75L8 1z" />
              </svg>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-gray-400 w-5 text-right shrink-0">{count}</span>
            </div>
          ))}
        </div>
      </div>
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
  const [activeRating, setActiveRating] = useState("Все");
  const [adminFilter, setAdminFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [hasReview, setHasReview] = useState(false);
  const checkedRef = useRef(false);

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

  // Проверяем fingerprint один раз при загрузке
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    const fp = getFingerprint();
    fetch(`${API}?action=check&fp=${encodeURIComponent(fp)}`)
      .then((r) => r.json())
      .then((d) => setHasReview(d.has_review === true))
      .catch(() => {});
  }, []);

  function handleAdminLogin(token: string) {
    setAdminToken(token);
    setShowAdminLogin(false);
    setTab("admin");
  }

  const pendingCount = adminReviews.filter((r) => r.status === "pending").length;

  const publicFiltered = reviews.filter((r) => {
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
    <div className="min-h-screen bg-gradient-to-b from-green-50/60 to-white font-golos">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-green-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shadow-sm shadow-green-200">
              <Icon name="Star" size={17} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">Отзывы клиентов</p>
              <p className="text-xs text-gray-400 leading-tight">{reviews.length} опубликованных</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
              <button onClick={() => setTab("public")}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${tab === "public" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                Витрина
              </button>
              <button onClick={() => { if (!adminToken) setShowAdminLogin(true); else setTab("admin"); }}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${tab === "admin" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {adminToken && pendingCount > 0 && (
                  <span className="w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">{pendingCount}</span>
                )}
                Модерация
              </button>
            </div>
            {adminToken && (
              <button onClick={() => { setAdminToken(null); setTab("public"); setAdminReviews([]); }}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1">
                <Icon name="LogOut" size={15} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-10 space-y-6">
        {/* ── Public ── */}
        {tab === "public" && (
          <>
            <RatingBlock reviews={reviews} />

            <ReviewForm onSuccess={() => { fetchPublic(); setHasReview(true); }} hasReview={hasReview} />

            {/* Фильтр по оценке */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Фильтр:</span>
              {RATINGS.map((r) => (
                <button key={r} onClick={() => setActiveRating(r)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all border ${activeRating === r ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-500 border-gray-200 hover:border-green-300 hover:text-green-600"}`}>
                  {r}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-11 h-11 rounded-full bg-green-50" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                        <div className="h-2 bg-gray-100 rounded-lg w-1/3" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-100 rounded-lg" />
                      <div className="h-2 bg-gray-100 rounded-lg w-4/5" />
                      <div className="h-2 bg-gray-100 rounded-lg w-3/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : publicFiltered.length === 0 ? (
              <div className="text-center py-24 animate-fade-in">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="MessageSquare" size={32} className="text-green-300" />
                </div>
                <p className="font-semibold text-gray-700">Отзывов пока нет</p>
                <p className="text-sm text-gray-400 mt-1">Будьте первым, кто оставит отзыв</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {publicFiltered.map((r, i) => <ReviewCard key={r.id} review={r} index={i} />)}
              </div>
            )}
          </>
        )}

        {/* ── Admin ── */}
        {tab === "admin" && adminToken && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Панель модерации</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Всего: {adminReviews.length} · Ожидают: <span className="text-amber-600 font-semibold">{pendingCount}</span>
                </p>
              </div>
              <div className="flex bg-white border border-gray-100 rounded-xl p-1 gap-0.5 shadow-sm flex-wrap">
                {([["all", "Все"], ["pending", "На проверке"], ["approved", "Одобренные"], ["rejected", "Отклонённые"]] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setAdminFilter(val)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${adminFilter === val ? "bg-green-600 text-white" : "text-gray-500 hover:text-gray-700"}`}>
                    {label}
                    {val === "pending" && pendingCount > 0 && (
                      <span className="w-4 h-4 bg-amber-400 text-white rounded-full text-[10px] inline-flex items-center justify-center font-bold">{pendingCount}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {adminFiltered.length === 0 ? (
              <div className="text-center py-24 animate-fade-in">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Inbox" size={32} className="text-green-300" />
                </div>
                <p className="font-semibold text-gray-700">Нет отзывов в этой категории</p>
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
