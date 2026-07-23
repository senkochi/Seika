import { useEffect, useState } from "react";

import { walletService } from "../../../api";

export interface PriceRange {
  minPrice: number;
  maxPrice: number;
}

export function useProductPriceRange(): PriceRange {
  const [minPrice, setMinPrice] = useState<number>(10);
  const [maxPrice, setMaxPrice] = useState<number>(100000);

  useEffect(() => {
    walletService
      .getConfigs()
      .then((configs) => {
        if (configs && Array.isArray(configs)) {
          configs.forEach((cfg) => {
            if (cfg.key === "MIN_PRODUCT_PRICE" && cfg.value) {
              setMinPrice(Number(cfg.value));
            } else if (cfg.key === "MAX_PRODUCT_PRICE" && cfg.value) {
              setMaxPrice(Number(cfg.value));
            }
          });
        }
      })
      .catch((err) => console.error("Could not fetch system configs:", err));
  }, []);

  return { minPrice, maxPrice };
}