// Call this from Experiment Setup page after protocol and variables are selected.

export function sendExperimentToAnalysisAI(experimentId: string) {
  return {
    route: `/dashboard/analytics-ai?experimentId=${experimentId}`,
    payload: {
      experimentId,
      source: 'research_studio',
      nextStage: 'analysis_ai',
    },
  };
}
