import { useEffect, useState } from "react";
import { getProducts } from "../services/productApi";

export function useLowestProductPrice() {
  const [price, setPrice] = useState(null);

  useEffect(() => {
    getProducts()
      .then((data) => {
        const active = data.filter((p) => p.status.toUpperCase() === "ACTIVE");
        const prices = active.map((p) => Number(p.price)).filter((n) => n > 0);
        setPrice(prices.length ? Math.min(...prices) : null);
      })
      .catch(() => setPrice(null));
  }, []);

  return price;
}
