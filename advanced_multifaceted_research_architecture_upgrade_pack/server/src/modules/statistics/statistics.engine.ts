export interface StatisticsEngine {
  runLinearRegression(input: unknown): Promise<unknown>
  runLogisticRegression(input: unknown): Promise<unknown>
  runAnova(input: unknown): Promise<unknown>
}
