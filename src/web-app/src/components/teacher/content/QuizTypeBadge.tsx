import { useTranslation } from "react-i18next";

interface QuizTypeBadgeStyle {
  bg: string;
  text: string;
}

export const QUIZ_TYPE_BADGES: Record<string, QuizTypeBadgeStyle> = {
  MULTIPLE_CHOICE: {
    bg: "bg-blue-500/15",
    text: "text-blue-300",
  },
  MATCHING: {
    bg: "bg-violet-500/15",
    text: "text-violet-300",
  },
  REORDER: {
    bg: "bg-amber-500/15",
    text: "text-amber-300",
  },
  FILL_IN_THE_BLANK: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
  },
};

export function getQuizTypeBadge(type: string): QuizTypeBadgeStyle {
  return (
    QUIZ_TYPE_BADGES[type] ?? {
      bg: "bg-white/[0.06]",
      text: "text-white/75",
    }
  );
}

interface QuizTypeBadgeProps {
  type: string;
}

function QuizTypeBadge({ type }: QuizTypeBadgeProps) {
  const { t } = useTranslation("teacher");
  const badge = getQuizTypeBadge(type);
  const getLabel = (tp: string) => {
    switch (tp) {
      case "MULTIPLE_CHOICE":
        return t("content.quizTypeMC");
      case "MATCHING":
        return t("content.quizTypeMatching");
      case "REORDER":
        return t("content.quizTypeReorder");
      case "FILL_IN_THE_BLANK":
        return t("content.quizTypeFill");
      default:
        return tp;
    }
  };
  return (
    <span
      className={`inline-block mb-2 px-2.5 py-1 ${badge.bg} ${badge.text} text-xs font-medium rounded-md`}
    >
      {getLabel(type)}
    </span>
  );
}

export default QuizTypeBadge;
