import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { DatasetReadResult, FileReader } from './file-reader.interface';

@Injectable()
export class XlsxFileReader implements FileReader {
  supports(filename: string, mimeType?: string) {
    return filename.toLowerCase().endsWith('.xlsx') || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }

  async read(buffer: Buffer): Promise<DatasetReadResult> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
    const previewRows = rows.slice(0, 25);
    const columnNames = previewRows[0] ? Object.keys(previewRows[0]) : [];

    return {
      rowCount: rows.length,
      columnCount: columnNames.length,
      columns: columnNames.map((name) => ({
        name,
        inferredType: 'string' as const,
        nullable: rows.some((row) => row[name] == null),
        sampleValues: rows.map((row) => row[name]).slice(0, 5),
      })),
      previewRows,
      profile: {
        format: 'xlsx',
        sheets: workbook.SheetNames,
      },
    };
  }
}
