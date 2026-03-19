import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Review {
  id: number;
  author: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
  status: "approved" | "pending" | "rejected";
  source: string;
}

const MOCK_REVIEWS: Review[] = [
  {
    id: 1,
    author: "Анна Петрова",
    avatar: "АП",
    rating: 5,
    text: "Просто восхитительно! Бот помог мне разобраться с заказом за пару минут. Никогда не думала, что автоматический сервис может быть таким удобным и человечным.",
    date: "15 марта 2026",
    status: "approved",
    source: "Telegram",
  },
  {
    id: 2,
    author: "Михаил Соколов",
    avatar: "МС",
    rating: 5,
    text: "Работает без сбоев, отвечает мгновенно. Рекомендую всем, кто ценит своё время.",
    date: "12 марта 2026",
    status: "approved",
    source: "VK",
  },
  {
    id: 3,
    author: "Елена Власова",
    avatar: "ЕВ",
    rating: 4,
    text: "Очень удобно! Иногда приходится уточнять вопросы, но в целом сервис на высоте. Обязательно воспользуюсь снова.",
    date: "10 марта 2026",
    status: "pending",
    source: "Telegram",
  },
  {
    id: 4,
    author: "Дмитрий Козлов",
    avatar: "ДК",
    rating: 5,
    text: "Потрясающий сервис! Решил проблему, с которой обращался к живым менеджерам три дня. Бот справился за 5 минут.",
    date: "8 марта 2026",
    status: "approved",
    source: "WhatsApp",
  },
  {
    id: 5,
    author: "Ольга Сидорова",
    avatar: "ОС",
    rating: 5,
    text: "Умный, быстрый, вежливый. Даже не верится, что это робот. Стала пользоваться каждый день.",
    date: "5 марта 2026",
    status: "approved",
    source: "Telegram",
  },
  {
    id: 6,
    author: "Игорь Волков",
    avatar: "ИВ",
    rating: 4,
    text: "Хорошая работа команды. Всё чётко, понятно, без лишних слов. Нашёл что искал с первого раза.",
    date: "2 марта 2026",
    status: "pending",
    source: "VK",
  },
  {
    id: 7,
    author: "Наталья Морозова",
    avatar: "НМ",
    rating: 5,
    text: "Самый лучший бот, которым я пользовалась. Легко, быстро и приятно!",
    date: "28 февраля 2026",
    status: "approved",
    source: "WhatsApp",
  },
  {
    id: 8,
    author: "Сергей Новиков",
    avatar: "СН",
    rating: 3,
    text: "Бот справился с задачей, но интерфейс можно сделать понятнее. В целом нормально.",
    date: "25 февраля 2026",
    status: "rejected",
    source: "Telegram",
  },
];

const SOURCES = ["Все", "Telegram", "VK", "WhatsApp"];
const RATINGS = ["Все", "5★", "4★", "3★"];

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width={size}
          height={size}
          viewBox="0 0 16 16"
          fill={star <= rating ? "#1a1a1a" : "none"}
          stroke={star <= rating ? "#1a1a1a" : "#d1d5db"}
          strokeWidth="1.5"
        >
          <path d="M8 1l1.85 3.75L14 5.5l-3 2.92.71 4.13L8 10.4l-3.71 2.15.71-4.13L2 5.5l4.15-.75L8 1z" />
        </svg>
      ))}
    </div>
  );
}

function AvatarCircle({ initials }: { initials: string }) {
  const colors: Record<string, string> = {
    А: "#e8f4f0",
    М: "#f0e8f4",
    Е: "#f4f0e8",
    Д: "#e8eef4",
    О: "#f4e8e8",
    И: "#eef4e8",
    Н: "#f4ece8",
    С: "#e8f4f4",
  };
  const bg = colors[initials[0]] || "#f5f5f5";
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-gray-700 shrink-0"
      style={{ backgroundColor: bg }}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: Review["status"] }) {
  const map = {
    approved: { label: "Опубликован", cls: "bg-emerald-50 text-emerald-700" },
    pending: { label: "На проверке", cls: "bg-amber-50 text-amber-700" },
    rejected: { label: "Отклонён", cls: "bg-red-50 text-red-600" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {label}
    </span>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-4 hover:border-gray-200 hover:shadow-sm transition-all duration-200 animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <AvatarCircle initials={review.avatar} />
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">
              {review.author}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {review.source} · {review.date}
            </p>
          </div>
        </div>
        <StatusBadge status={review.status} />
      </div>

      <StarRating rating={review.rating} />

      <p className="text-gray-600 text-sm leading-relaxed">{review.text}</p>

      {review.status === "pending" && (
        <div className="flex gap-2 pt-1">
          <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-colors">
            <Icon name="Check" size={13} />
            Опубликовать
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
            <Icon name="X" size={13} />
            Отклонить
          </button>
        </div>
      )}
    </div>
  );
}

export default function Index() {
  const [activeSource, setActiveSource] = useState("Все");
  const [activeRating, setActiveRating] = useState("Все");
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");

  const approved = MOCK_REVIEWS.filter((r) => r.status === "approved");
  const pending = MOCK_REVIEWS.filter((r) => r.status === "pending");
  const avgRating =
    approved.reduce((s, r) => s + r.rating, 0) / (approved.length || 1);

  const filtered = MOCK_REVIEWS.filter((r) => {
    if (activeTab === "pending") return r.status === "pending";
    if (activeSource !== "Все" && r.source !== activeSource) return false;
    if (activeRating !== "Все" && r.rating !== parseInt(activeRating)) return false;
    return true;
  });

  const dist = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: approved.filter((r) => r.rating === s).length,
    pct: Math.round(
      (approved.filter((r) => r.rating === s).length / (approved.length || 1)) * 100
    ),
  }));

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
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Icon name="Clock" size={14} />
            <span>{pending.length} на проверке</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Rating block */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Big number */}
            <div className="text-center shrink-0">
              <div className="text-6xl font-bold text-gray-900 leading-none">
                {avgRating.toFixed(1)}
              </div>
              <div className="mt-2">
                <StarRating rating={Math.round(avgRating)} size={18} />
              </div>
              <p className="text-xs text-gray-400 mt-2">{approved.length} отзывов</p>
            </div>

            {/* Bar chart */}
            <div className="flex-1 space-y-2.5 w-full">
              {dist.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-4 shrink-0">{star}</span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 16 16"
                    fill="#1a1a1a"
                    className="shrink-0"
                  >
                    <path d="M8 1l1.85 3.75L14 5.5l-3 2.92.71 4.13L8 10.4l-3.71 2.15.71-4.13L2 5.5l4.15-.75L8 1z" />
                  </svg>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-gray-800 h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-6 text-right shrink-0">
                    {count}
                  </span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex md:flex-col gap-6 md:gap-4 shrink-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{approved.length}</div>
                <div className="text-xs text-gray-400">опубликовано</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{pending.length}</div>
                <div className="text-xs text-gray-400">ожидают</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs + Filters */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex bg-white border border-gray-100 rounded-xl p-1 gap-1">
            {(["all", "pending"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "all" ? "Все отзывы" : `На проверке · ${pending.length}`}
              </button>
            ))}
          </div>

          {activeTab === "all" && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex bg-white border border-gray-100 rounded-xl p-1 gap-1">
                {SOURCES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveSource(s)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      activeSource === s
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex bg-white border border-gray-100 rounded-xl p-1 gap-1">
                {RATINGS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setActiveRating(r)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      activeRating === r
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reviews grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 animate-fade-in">
            <Icon name="Inbox" size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Отзывов не найдено</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((review, i) => (
              <ReviewCard key={review.id} review={review} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
