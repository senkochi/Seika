import { useState } from "react";
import { DollarSign, FileText, Loader2, Trash2, X } from "lucide-react";

import type { Card, CardSetResponse } from "../../../api";
import { flashcardsService } from "../../../api";
import { showError, showSuccess } from "../../toast/toastUtils";
import { useProductPriceRange } from "./useProductPriceRange";

interface FlashcardSetFormProps {
  initial?: CardSetResponse;
  onSaved: () => void;
  onCancel: () => void;
}

function FlashcardSetForm({
  initial,
  onSaved,
  onCancel,
}: FlashcardSetFormProps) {
  const { minPrice, maxPrice } = useProductPriceRange();

  const [title, setTitle] = useState<string>(initial?.title ?? "");
  const [description, setDescription] = useState<string>(
    initial?.description ?? "",
  );
  const [price, setPrice] = useState<number>(initial?.price ?? 0);
  const [cards, setCards] = useState<Card[]>(
    initial?.cards && initial.cards.length > 0
      ? initial.cards.map((c) => ({
          frontSide: c.frontSide,
          backSide: c.backSide,
        }))
      : [{ frontSide: "", backSide: "" }],
  );
  const [loading, setLoading] = useState<boolean>(false);

  const editingId = initial?.id;
  const isEditing = Boolean(editingId);

  const handleAddCard = () =>
    setCards((prev) => [...prev, { frontSide: "", backSide: "" }]);

  const handleRemoveCard = (index: number) => {
    if (cards.length === 1) return;
    setCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCardChange = (
    index: number,
    field: "frontSide" | "backSide",
    val: string,
  ) => {
    setCards((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return showError("Tiêu đề là bắt buộc.");
    if (cards.some((c) => !c.frontSide.trim() || !c.backSide.trim())) {
      return showError("Mỗi thẻ phải có nội dung mặt trước và mặt sau.");
    }
    if (price < 0) return showError("Giá sản phẩm không được nhỏ hơn 0.");
    if (price > 0 && (price < minPrice || price > maxPrice)) {
      return showError(
        `Giá sản phẩm phải nằm trong khoảng từ ${minPrice} đến ${maxPrice} coin!`,
      );
    }

    setLoading(true);
    try {
      const payload = {
        title,
        description,
        price: Number(price),
        cards,
      };
      if (isEditing && editingId) {
        await flashcardsService.update(editingId, payload);
        showSuccess("Flashcard Set đã được cập nhật thành công!");
      } else {
        await flashcardsService.create(payload);
        showSuccess("Flashcard Set đã được tạo thành công!");
      }
      onSaved();
    } catch (err) {
      console.error(err);
      showError(
        isEditing ? "Không thể cập nhật Flashcard Set." : "Không thể tạo Flashcard Set.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl space-y-6"
    >
      <div className="border-b border-[var(--border)] pb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-[var(--foreground)]">
          {isEditing ? "Cập nhật Bộ Flashcard" : "Tạo Bộ Flashcard Mới"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--foreground)] mb-2">
              Tiêu đề Bộ thẻ
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--foreground)] mb-2">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] resize-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-[var(--foreground)] mb-2">
            Giá Marketplace (Coins)
          </label>
          <div className="relative">
            <DollarSign className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="number"
              min={0}
              value={price === 0 ? "" : price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full pl-10 pr-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
            />
          </div>
          <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
            Không nhập gì nếu miễn phí. Khi bán trên Marketplace, giá phải từ{" "}
            <span className="font-semibold text-amber-400">{minPrice}</span> đến{" "}
            <span className="font-semibold text-amber-400">{maxPrice}</span> coin.
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--border)] pt-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--primary)]" />
            Danh sách Thẻ ({cards.length})
          </h3>
          <button
            type="button"
            onClick={handleAddCard}
            className="px-4 py-2 bg-purple-900/40 text-purple-300 border border-purple-800 rounded-xl text-xs font-semibold"
          >
            + Thêm thẻ
          </button>
        </div>
        <div className="space-y-4 max-h-[30rem] overflow-y-auto pr-2">
          {cards.map((card, index) => (
            <div
              key={index}
              className="p-4 bg-[var(--second-card)] border border-[var(--border)] rounded-2xl flex gap-4 items-center"
            >
              <span className="font-bold text-xs text-[var(--muted-foreground)] w-6 text-center">
                {index + 1}
              </span>
              <div className="flex-1 grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Mặt trước"
                  required
                  value={card.frontSide}
                  onChange={(e) =>
                    handleCardChange(index, "frontSide", e.target.value)
                  }
                  className="px-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Mặt sau"
                  required
                  value={card.backSide}
                  onChange={(e) =>
                    handleCardChange(index, "backSide", e.target.value)
                  }
                  className="px-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none"
                />
              </div>
              <button
                type="button"
                disabled={cards.length === 1}
                onClick={() => handleRemoveCard(index)}
                className="p-2 text-red-400 hover:text-red-500 disabled:opacity-30"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--border)] pt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:opacity-90 flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}{" "}
          {isEditing ? "Lưu thay đổi" : "Xuất bản Bộ thẻ"}
        </button>
      </div>
    </form>
  );
}

export default FlashcardSetForm;