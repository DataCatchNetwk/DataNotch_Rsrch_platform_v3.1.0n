export interface SurvivalEngine {
  runKaplanMeier(input: unknown): Promise<unknown>
  runCoxPH(input: unknown): Promise<unknown>
}
