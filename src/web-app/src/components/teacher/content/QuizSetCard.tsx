import { DollarSign, Edit, Trash2 } from "lucide-react";

import type { QuizSetResponse } from "../../../api/types";
import type { Product } from "../../../api/services/marketplace";
import ProductStatusBadge from "./ProductStatusBadge";

interface QuizSetCardProps {
  set: QuizSetResponse;
  product?: Product;
  onEdit: (set: QuizSetResponse) => void;
  onDelete: (set: QuizSetResponse) => void;
}

function QuizSetCard({
  set,
  product,
  onEdit,
  onDelete,
}: QuizSetCardProps) {
  return (
    <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between hover:border-[var(--primary)] transition-all group">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full">
              {set.quizzes?.length || 0} câu hỏi
            </span>
            <ProductStatusBadge
              status={product?.status}
              rejectionReason={product?.rejectionReason}
            />
          </div>
          <span className="flex items-center text-yellow-400 font-bold text-sm">
            <DollarSign className="w-4 h-4" />
            {set.price > 0 ? `${set.price} Coins` : "Miễn phí"}
          </span>
        </div>
        <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
          {set.title}
        </h3>
        <p className="text-[var(--muted-foreground)] text-sm line-clamp-3 mb-6">
          {set.description || "Chưa có mô tả."}
        </p>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
        <span className="text-xs text-[var(--muted-foreground)]">
          {new Date(set.createdAt).toLocaleDateString()}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(set)}
            className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-all"
            title="Sửa bộ đề"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(set)}
            className="p-2 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            title="Xóa bộ đề"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizSetCard;