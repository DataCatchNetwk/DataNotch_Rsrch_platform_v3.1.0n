export interface MlEngine {
  runClassification(input: unknown): Promise<unknown>
  runRegression(input: unknown): Promise<unknown>
  runClustering(input: unknown): Promise<unknown>
}
