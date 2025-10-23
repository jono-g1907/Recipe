export interface InventoryItem {
  inventoryId: string;
  userId: string;
  ingredientName: string;
  quantity: number | null;
  unit: string;
  category: string;
  purchaseDate: string | null;
  expirationDate: string | null;
  location: string;
  cost: number | null;
  createdDate: string | null;
  updatedAt: string | null;
  daysUntilExpiration: number | null;
  expirationStatus: 'expired' | 'soon' | 'ok' | 'unknown';
  inventoryValue: number | null;
}

export interface InventoryListResponse {
  items: InventoryItem[];
  page: number;
  total: number;
  limit: number;
}

export interface InventoryValueBreakdown {
  group: string;
  totalValue: number;
  itemCount: number;
}

export interface InventoryValueResponse {
  totalValue: number;
  groupBy?: 'category' | 'location' | null;
  breakdown?: InventoryValueBreakdown[];
}
