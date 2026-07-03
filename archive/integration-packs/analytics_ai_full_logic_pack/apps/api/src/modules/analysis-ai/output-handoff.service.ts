export function buildOutputPayload(result: any) {
  return {
    analysisResult: result,
    visualizationSpecs: result.visualizations ?? [],
    publicationTables: result.tables ?? [],
    interpretation: result.interpretation,
    exportFormats: ['csv', 'xlsx', 'pdf', 'docx', 'pptx', 'png', 'svg'],
  };
}
