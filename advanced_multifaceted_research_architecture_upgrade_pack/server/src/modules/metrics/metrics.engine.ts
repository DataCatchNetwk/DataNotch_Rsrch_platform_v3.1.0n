export interface MetricsEngine {
  classification(input: unknown): Promise<{ precision: number; recall: number; f1: number }>
  regression(input: unknown): Promise<{ rmse: number; mae: number; r2: number }>
  survival(input: unknown): Promise<{ cIndex: number }>
}
