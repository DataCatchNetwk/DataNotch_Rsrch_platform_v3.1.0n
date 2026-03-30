import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { DatasetReadResult, FileReader, InferredType } from './file-reader.interface';

@Injectable()
export class CsvFileReader implements FileReader {
  supports(filename: string, mimeType?: string) {
    const lower = filename.toLowerCase();
    return lower.endsWith('.csv') || lower.endsWith('.tsv') || mimeType === 'text/csv';
  }

  async read(buffer: Buffer): Promise<DatasetReadResult> {
    const text = buffer.toString('utf8');
    const rows = parse(text, { columns: true, skip_empty_lines: true, relax_column_count: true }) as Record<string, unknown>[];
    const previewRows = rows.slice(0, 25);
    const columnNames = previewRows[0] ? Object.keys(previewRows[0]) : [];

    return {
      rowCount: rows.length,
      columnCount: columnNames.length,
      columns: columnNames.map((name) => {
        const values = rows.map((row) => row[name]).filter((v) => v !== null && v !== undefined);
        return {
          name,
          inferredType: inferType(values),
          nullable: values.length !== rows.length,
          sampleValues: values.slice(0, 5),
        };
      }),
      previewRows,
      profile: {
        format: 'csv',
        totalRows: rows.length,
        totalColumns: columnNames.length,
      },
    };
  }
}

function inferType(values: unknown[]): InferredType {
  if (!values.length) return 'unknown';
  const normalized = values.map((v) => String(v).trim());
  if (normalized.every((v) => v === 'true' || v === 'false')) return 'boolean';
  if (normalized.every((v) => v !== '' && !Number.isNaN(Number(v)))) return 'number';
  if (normalized.every((v) => !Number.isNaN(Date.parse(v)))) return 'date';
  return 'string';
}
