import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCurrentUserProfile } from "../../store/userProfileSlice";
import { flashcardsService, quizzesService } from "../../api";
import { marketplaceApi } from "../../api/services/marketplace";
import type { CardSetResponse, QuizSetResponse } from "../../api";
import type { Product } from "../../api/services/marketplace";
import { showError, showSuccess } from "../../components/toast/toastUtils";

import ConfirmDialog from "../../components/teacher/content/ConfirmDialog";
import ContentManagerHeader from "../../components/teacher/content/ContentManagerHeader";
import ContentManagerTabs, {
  type ContentTab,
} from "../../components/teacher/content/ContentManagerTabs";
import ContentListEmpty from "../../components/teacher/content/ContentListEmpty";
import FlashcardSetCard from "../../components/teacher/content/FlashcardSetCard";
import FlashcardSetForm from "../../components/teacher/content/FlashcardSetForm";
import QuizSetCard from "../../components/teacher/content/QuizSetCard";
import QuizSetForm from "../../components/teacher/content/QuizSetForm";

type DeleteTarget = {
  type: "flashcard" | "quizset";
  id: string;
  title: string;
};

function ContentManager() {
  const { t } = useTranslation("teacher");
  const dispatch = useAppDispatch();
  const { userId, status } = useAppSelector((state) => state.userProfile);

  const [activeTab, setActiveTab] = useState<ContentTab>("flashcards");
  const [flashcardSets, setFlashcardSets] = useState<CardSetResponse[]>([]);
  const [quizSets, setQuizSets] = useState<QuizSetResponse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(false);

  const [editingFlashcard, setEditingFlashcard] =
    useState<CardSetResponse | null>(null);
  const [editingQuizSet, setEditingQuizSet] = useState<QuizSetResponse | null>(
    null,
  );

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [loadingDelete, setLoadingDelete] = useState<boolean>(false);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCurrentUserProfile());
    }
  }, [status, dispatch]);

  const loadData = async () => {
    if (!userId) return;
    setLoadingList(true);
    try {
      try {
        const prodRes = await marketplaceApi.getMyProducts();
        setProducts(prodRes.data || []);
      } catch (err) {
        console.warn("Could not fetch marketplace products:", err);
      }

      if (activeTab === "flashcards") {
        const sets = await flashcardsService.getByAuthorId(userId);
        setFlashcardSets(sets);
      } else {
        const response = await quizzesService.getMyQuizSets();
        setQuizSets(response.data || []);
      }
    } catch (err) {
      console.error(err);
      showError(t("content.errLoadContent"));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userId]);

  const productFor = (referenceId: string) =>
    products.find((p) => p.referenceId === referenceId);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoadingDelete(true);
    try {
      if (deleteTarget.type === "flashcard") {
        await flashcardsService.deleteSet(deleteTarget.id);
        showSuccess(t("content.successDeleteFlashcard"));
      } else {
        await quizzesService.deleteQuizSet(deleteTarget.id);
        showSuccess(t("content.successDeleteQuiz"));
      }
      setDeleteTarget(null);
      void loadData();
    } catch (err) {
      console.error(err);
      showError(t("content.errDeleteFailed"));
    } finally {
      setLoadingDelete(false);
    }
  };

  const onFormSaved = () => {
    setEditingFlashcard(null);
    setEditingQuizSet(null);
    void loadData();
  };

  const editingAny = editingFlashcard !== null || editingQuizSet !== null;
  const showHeaderActions = !editingAny;
  const showTabs = !editingAny;

  const renderList = () => {
    if (loadingList) {
      return (
        <div className="flex flex-col items-center justify-center p-20 text-white/55 gap-4 font-sans-ui">
          <Loader2
            className="w-10 h-10 animate-spin text-[#d4a843]"
            aria-hidden="true"
          />
          <p>{t("content.loadingContent")}</p>
        </div>
      );
    }

    if (activeTab === "flashcards") {
      if (flashcardSets.length === 0) {
        return (
          <ContentListEmpty
            variant="flashcards"
            onCreate={() => setEditingFlashcard({} as CardSetResponse)}
          />
        );
      }
      return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flashcardSets.map((set) => (
            <FlashcardSetCard
              key={set.id}
              set={set}
              product={productFor(set.id)}
              onEdit={(s) => setEditingFlashcard(s)}
              onDelete={(s) =>
                setDeleteTarget({
                  type: "flashcard",
                  id: s.id,
                  title: s.title,
                })
              }
            />
          ))}
        </div>
      );
    }

    if (quizSets.length === 0) {
      return (
        <ContentListEmpty
          variant="quiz-sets"
          onCreate={() => setEditingQuizSet({} as QuizSetResponse)}
        />
      );
    }
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizSets.map((set) => (
          <QuizSetCard
            key={set.id}
            set={set}
            product={productFor(set.id)}
            onEdit={(s) => setEditingQuizSet(s)}
            onDelete={(s) =>
              setDeleteTarget({ type: "quizset", id: s.id, title: s.title })
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-8">
      {deleteTarget && (
        <ConfirmDialog
          title={
            deleteTarget.type === "flashcard"
              ? t("content.confirmDeleteFlashcardTitle")
              : t("content.confirmDeleteQuizTitle")
          }
          description={t("content.confirmDeleteDesc", {
            title: deleteTarget.title,
          })}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={loadingDelete}
        />
      )}

      <ContentManagerHeader
        onReload={loadData}
        activeTab={activeTab}
        showCreate={showHeaderActions}
        onCreate={() => {
          if (activeTab === "flashcards")
            setEditingFlashcard({} as CardSetResponse);
          else setEditingQuizSet({} as QuizSetResponse);
        }}
      />

      {showTabs && (
        <ContentManagerTabs activeTab={activeTab} onChange={setActiveTab} />
      )}

      {!editingAny && renderList()}

      {editingFlashcard !== null && (
        <FlashcardSetForm
          {...(editingFlashcard.id ? { initial: editingFlashcard } : {})}
          onSaved={onFormSaved}
          onCancel={() => setEditingFlashcard(null)}
        />
      )}

      {editingQuizSet !== null && (
        <QuizSetForm
          {...(editingQuizSet.id ? { initial: editingQuizSet } : {})}
          onSaved={onFormSaved}
          onCancel={() => setEditingQuizSet(null)}
        />
      )}
    </div>
  );
}

export default ContentManager;
