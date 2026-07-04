import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  HelpCircle,
  Plus,
  TrendingUp,
  Users,
  ArrowRight,
  Loader2,
  Layers,
  Sparkles,
} from "lucide-react";
import { useAppSelector } from "../../store/hooks";
import { flashcardsService, quizzesService } from "../../api";

interface DashboardStats {
  totalFlashcardSets: number;
  totalCards: number;
  totalQuizzes: number;
}

function TeacherDashboard() {
  const { userId, fullName } = useAppSelector((state) => state.userProfile);
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalFlashcardSets: 0,
    totalCards: 0,
    totalQuizzes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [sets, quizzesRes] = await Promise.allSettled([
          flashcardsService.getByAuthorId(userId),
          quizzesService.getMyQuizzes(),
        ]);

        const flashcardSets = sets.status === "fulfilled" ? sets.value : [];
        const quizList =
          quizzesRes.status === "fulfilled"
            ? (quizzesRes.value.data ?? [])
            : [];

        setStats({
          totalFlashcardSets: flashcardSets.length,
          totalCards: flashcardSets.reduce(
            (sum, s) => sum + (s.cards?.length ?? 0),
            0,
          ),
          totalQuizzes: quizList.length,
        });
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [userId]);

  const statCards = [
    {
      id: "stat-flashcard-sets",
      label: "Bộ Flashcard",
      value: stats.totalFlashcardSets,
      icon: BookOpen,
      color: "from-violet-600/20 to-purple-600/10",
      border: "border-violet-500/30",
      iconColor: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      id: "stat-total-cards",
      label: "Tổng số Thẻ",
      value: stats.totalCards,
      icon: Layers,
      color: "from-blue-600/20 to-cyan-600/10",
      border: "border-blue-500/30",
      iconColor: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      id: "stat-quiz-questions",
      label: "Câu hỏi Quiz",
      value: stats.totalQuizzes,
      icon: HelpCircle,
      color: "from-amber-600/20 to-orange-600/10",
      border: "border-amber-500/30",
      iconColor: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  const quickActions = [
    {
      id: "action-new-flashcard",
      label: "Tạo Bộ Flashcard",
      description: "Thêm bộ thẻ học mới cho học sinh",
      icon: BookOpen,
      color: "from-violet-600 to-purple-700",
      action: () => navigate("/teacher/dashboard/content"),
    },
    {
      id: "action-new-quiz",
      label: "Tạo Câu hỏi Quiz",
      description: "Soạn câu hỏi trắc nghiệm, ghép cặp...",
      icon: HelpCircle,
      color: "from-blue-600 to-indigo-700",
      action: () => navigate("/teacher/dashboard/content"),
    },
  ];

  return (
    <div className="p-8 space-y-10">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900/50 via-purple-900/40 to-indigo-900/50 border border-violet-500/20 p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-semibold text-sm">
              Teacher Portal
            </span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2">
            Xin chào,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-pink-300">
              {fullName ?? "Giáo viên"}
            </span>{" "}
            👋
          </h1>
          <p className="text-purple-200/70 text-lg">
            Quản lý nội dung học tập và theo dõi tiến độ học sinh của bạn.
          </p>
        </div>

        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-pink-600/10 rounded-full blur-2xl translate-y-1/2 pointer-events-none" />
      </div>

      {/* ── Stats ── */}
      <section>
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
          Tổng quan nội dung
        </h2>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {statCards.map((card) => (
              <div
                key={card.id}
                id={card.id}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.color} border ${card.border} p-6`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 ${card.bg} rounded-xl`}>
                    <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                </div>
                <p className="text-[var(--muted-foreground)] text-sm font-medium mb-1">
                  {card.label}
                </p>
                <p className="text-4xl font-black text-[var(--foreground)]">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Quick Actions ── */}
      <section>
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-[var(--primary)]" />
          Thao tác nhanh
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {quickActions.map((action) => (
            <button
              key={action.id}
              id={action.id}
              onClick={action.action}
              className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-left hover:border-[var(--primary)] transition-all hover:shadow-lg hover:shadow-purple-600/10"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity`}
              />
              <div className="relative z-10">
                <div
                  className={`inline-flex p-3 bg-gradient-to-br ${action.color} rounded-xl mb-4`}
                >
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-1 flex items-center gap-2">
                  {action.label}
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-[var(--muted-foreground)] text-sm">
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Content Manager Link ── */}
      <section>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[var(--primary)]/10 rounded-xl">
              <Users className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--foreground)]">
                Content Manager
              </h3>
              <p className="text-[var(--muted-foreground)] text-sm">
                Xem, chỉnh sửa và xóa tất cả nội dung đã tạo.
              </p>
            </div>
          </div>
          <button
            id="btn-goto-content-manager"
            onClick={() => navigate("/teacher/dashboard/content")}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all"
          >
            Quản lý
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

export default TeacherDashboard;
