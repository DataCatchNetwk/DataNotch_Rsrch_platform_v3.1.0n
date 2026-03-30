export type InferredType = 'string' | 'number' | 'boolean' | 'date' | 'unknown';

export type DatasetReadResult = {
  rowCount: number;
  columnCount: number;
  columns: Array<{
    name: string;
    inferredType: InferredType;
    nullable: boolean;
    sampleValues: unknown[];
  }>;
  previewRows: Record<string, unknown>[];
  profile: Record<string, unknown>;
};

export interface FileReader {
  supports(filename: string, mimeType?: string): boolean;
  read(buffer: Buffer): Promise<DatasetReadResult>;
}
