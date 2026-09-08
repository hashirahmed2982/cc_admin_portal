// types/catalogMatching.types.ts — Master Plan §9.2 "Link Products"

export interface StagingItem {
  staging_id: number;
  supplier: string;
  supplier_ref: string | null;
  supplier_sku_ref: string;
  item_name: string;
  brand_name: string | null;
  face_value: number | null;
  // `currency`: the currency cost_price is actually denominated in (always
  // USD for both suppliers, confirmed live). `face_value_currency`: the
  // card's own real-world denomination (e.g. GBP for a UK Apple card) —
  // a DIFFERENT thing, only ever the same value by coincidence. See
  // cc_backend migration 016 for the bug this split fixes.
  currency: string | null;
  face_value_currency: string | null;
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
