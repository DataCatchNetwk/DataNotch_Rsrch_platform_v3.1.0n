export interface GenomicsEngine {
  ingestVariantMetadata(input: unknown): Promise<unknown>
  normalizeExpressionMatrix(input: unknown): Promise<unknown>
  runPathwayEnrichment(input: unknown): Promise<unknown>
}
