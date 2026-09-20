export type Store = "ALDI" | "Winn-Dixie";
export type ListItem = { id: string; name: string; quantity: number; unit: string; checked: boolean };
export type Offer = {
  id: string; query: string; store: Store; name: string; price: number; packageQuantity: number;
  packageUnit: string; unitPrice: number | null; unitLabel: string; promo?: string; image?: string;
  url: string; status: "live" | "sample"; updatedAt: string;
};
export type ScanResult = { offers: Offer[]; sources: Record<Store, "live" | "sample" | "unavailable">; scannedAt: string; notes: string[] };
