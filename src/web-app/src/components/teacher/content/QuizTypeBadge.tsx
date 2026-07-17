import { useTranslation } from "react-i18next";

interface QuizTypeBadgeStyle {
  bg: string;
  text: string;
  label: string;
}

export const QUIZ_TYPE_BADGES: Record<string, QuizTypeBadgeStyle> = {
  MULTIPLE_CHOICE: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    label: "Trắc nghiệm",
  },
  MATCHING: {
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    label: "Ghép cặp",
  },
  REORDER: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    label: "Sắp xếp",
  },
  FILL_IN_THE_BLANK: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    label: "Điền từ",
  },
};

export function getQuizTypeBadge(type: string): QuizTypeBadgeStyle {
  return (
    QUIZ_TYPE_BADGES[type] ?? {
      bg: "bg-gray-500/10",
      text: "text-gray-400",
      label: type,
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
      className={`inline-block mb-2 px-2 py-0.5 ${badge.bg} ${badge.text} text-xs font-semibold rounded-md`}
    >
      {getLabel(type)}
    </span>
  );
}

export default QuizTypeBadge;
