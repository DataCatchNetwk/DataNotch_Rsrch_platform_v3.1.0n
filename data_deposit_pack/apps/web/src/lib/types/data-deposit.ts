export type DatasetDomain =
  | "HEALTH"
  | "SOCIAL"
  | "CLIMATE"
  | "ECONOMIC"
  | "EDUCATION"
  | "MOBILITY"
  | "ENVIRONMENT"
  | "GENOMICS"
  | "IMAGING"
  | "WEARABLE"
  | "SURVEY"
  | "OTHER";

export interface DepositDataset {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  domain: DatasetDomain;
  category?: string | null;
  tags: string[];
  sourceName?: string | null;
  accessLevel: string;
  rowCount?: number | null;
  columnCount?: number | null;
  sizeBytes?: string | number | null;
  updatedAt: string;
  publishedAt?: string | null;
  isFeatured: boolean;
  isFavorite?: boolean;
}

export interface DepositPreview {
  id: string;
  name: string;
  rowCount?: number | null;
  columnCount?: number | null;
  schemaJson?: unknown;
  previewRowsJson?: unknown[] | null;
}
