import { useEffect, useState } from "react";

import {
  marketplaceApi,
  type TeacherRating,
} from "../../api/services/marketplace";

export function useTeacherRating(teacherId?: string | null) {
  const [rating, setRating] = useState<TeacherRating | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!teacherId) {
      setRating(null);
      return;
    }

    setLoading(true);
    marketplaceApi
      .getTeacherRating(teacherId)
      .then((response) => {
        if (!cancelled) setRating(response.data);
      })
      .catch(() => {
        if (!cancelled) setRating(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  return { rating, loading };
}
