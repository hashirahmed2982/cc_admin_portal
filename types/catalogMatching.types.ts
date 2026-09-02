// types/catalogMatching.types.ts — Master Plan §9.2 "Link Products"

export interface StagingItem {
  staging_id: number;
  supplier: string;
  supplier_ref: string | null;
  supplier_sku_ref: string;
  item_name: string;
  brand_name: string | null;
  face_value: number | null;
  currency: string | null;
  region: string | null;
  cost_price: number | null;
  match_key: string | null;
  suggested_sku_id: number | null;
  suggested_sku_name: string | null;
  suggested_product_name: string | null;
  status: "pending_review" | "linked" | "created_new" | "rejected" | "ignored";
  created_at: string;
  updated_at: string;
}

export interface SuggestedMatch {
  sku_id: number;
  sku_name: string;
  face_value: number | null;
  price_currency: string;
  selling_price: number;
  product_id: number;
  product_name: string;
  brand_name: string | null;
  source: string;
}

export interface StagingItemDetail extends StagingItem {
  computedMatchKey: string;
  suggestedMatches: SuggestedMatch[];
}
