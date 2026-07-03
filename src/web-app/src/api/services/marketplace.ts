import { apiClient } from "../client";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: "FLASHCARD" | "QUIZ";
  referenceId: string;
  sellerUserId: string;
  status?: string;
  rejectionReason?: string | null;
  createdAt: string;
}

export interface OrderItemRequest {
  productId: string;
  productType: string;
  referenceId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  sellerUserId: string;
}

export const marketplaceApi = {
  // Products
  getProducts: () => apiClient.get<Product[]>("/marketplace/products"),
  getMyProducts: () =>
    apiClient.get<Product[]>("/marketplace/products/my-products"),

  // Inventory
  getMyInventory: () =>
    apiClient.get<Product[]>("/marketplace/inventory/my-items"),

  // Orders
  createOrder: (userId: string, items: OrderItemRequest[]) =>
    apiClient.post<any>("/marketplace/orders", { userId, items }),
};
