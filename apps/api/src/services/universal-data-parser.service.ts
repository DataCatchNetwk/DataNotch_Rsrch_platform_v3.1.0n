import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';

export type ParsedDataProfile = {
  connectorType: string;
  format: string;
  recordCount?: number;
  columnCount?: number;
  schemaJson?: Array<{ name: string; type: string; nullable: boolean }>;
  previewRowsJson?: Array<Record<string, unknown>>;
  metadataJson?: Record<string, unknown>;
};

type ZipEntry = {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  data: Buffer;
};

const MAX_PREVIEW_ROWS = 25;
const MAX_PARSE_BYTES = 25 * 1024 * 1024;

export function classifySourceConnector(source: { url?: string | null; format?: string | null }) {
  const url = String(source.url ?? '').toLowerCase();
  const fmt = String(source.format ?? '').toLowerCase().replace(/^\./, '');

  if (url.includes('.json') || ['json', 'jsonl', 'fhir', 'geojson'].includes(fmt)) return 'JSON_API_OR_FILE';
  if (url.includes('.xml') || fmt === 'xml') return 'XML_FILE';
  if (url.includes('.parquet') || fmt === 'parquet') return 'PARQUET_FILE';
  if (url.includes('.zip') || fmt === 'zip') return 'ZIP_ARCHIVE';
  if (url.includes('.csv') || fmt === 'csv') return 'DIRECT_CSV';
  if (url.includes('.tsv') || fmt === 'tsv') return 'TSV_FILE';
  if (url.includes('.xlsx') || url.includes('.xls') || ['xlsx', 'xls'].includes(fmt)) return 'EXCEL_FILE';
  if (url.startsWith('http')) return 'WEB_DOWNLOAD';
  return 'MANUAL_REQUIRED';
}

export class UniversalDataParser {
  async parse(filePath: string, originalName = path.basename(filePath), mimeType = ''): Promise<ParsedDataProfile> {
    const fileStats = await stat(filePath);
    const extension = getExtension(originalName || filePath);
    const format = detectFormat(extension, mimeType, originalName);
    const connectorType = classifySourceConnector({ url: originalName, format });

    if (fileStats.size > MAX_PARSE_BYTES && !['pdf', 'parquet', 'nii', 'nii.gz', 'zip'].includes(format)) {
      return this.metadataOnly(filePath, originalName, mimeType, format, connectorType, {
        warning: `File is larger than ${Math.round(MAX_PARSE_BYTES / 1024 / 1024)} MB; stored and profiled as metadata only.`,
      });
    }

    if (['csv', 'tsv', 'txt'].includes(format)) {
      const delimiter = format === 'tsv' ? '\t' : ',';
      return this.parseDelimited(filePath, originalName, mimeType, format, connectorType, delimiter);
    }

    if (format === 'json' || format === 'jsonl' || format === 'geojson' || format === 'fhir') {
      return this.parseJsonLike(filePath, originalName, mimeType, format, connectorType);
    }

    if (format === 'xlsx' || format === 'xls') {
      return this.parseXlsx(filePath, originalName, mimeType, connectorType);
    }

    if (format === 'xml') {
      return this.parseXml(filePath, originalName, mimeType, connectorType);
    }

    if (format === 'zip') {
      return this.parseZip(filePath, originalName, mimeType, connectorType);
    }

    return this.metadataOnly(filePath, originalName, mimeType, format, connectorType);
  }

  private async parseDelimited(
    filePath: string,
    originalName: string,
    mimeType: string,
    format: string,
    connectorType: string,
    delimiter: string,
  ): Promise<ParsedDataProfile> {
    const content = await readFile(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const header = lines[0] ? parseDelimitedLine(lines[0], delimiter).map((value, index) => value || `column_${index + 1}`) : [];
    const previewRows = lines.slice(1, MAX_PREVIEW_ROWS + 1).map((line) => {
      const values = parseDelimitedLine(line, delimiter);
      return Object.fromEntries(header.map((column, index) => [column, values[index] ?? '']));
    });

    return buildProfile({
      connectorType,
      format,
      originalName,
      mimeType,
      recordCount: Math.max(lines.length - 1, 0),
      columns: header,
      previewRows,
      metadata: { parser: 'delimited', delimiter },
    });
  }

  private async parseJsonLike(
    filePath: string,
    originalName: string,
    mimeType: string,
    format: string,
    connectorType: string,
  ): Promise<ParsedDataProfile> {
    const content = await readFile(filePath, 'utf8');
    const rows =
      format === 'jsonl'
        ? content
            .split(/\r?\n/)
            .filter(Boolean)
            .map((line) => JSON.parse(line))
        : normalizeJsonRows(JSON.parse(content));

    const previewRows = rows.slice(0, MAX_PREVIEW_ROWS).map((row) => flattenObject(row));
    const columns = collectColumns(previewRows);

    return buildProfile({
      connectorType,
      format,
      originalName,
      mimeType,
      recordCount: rows.length,
      columns,
      previewRows,
      metadata: { parser: format === 'jsonl' ? 'jsonl' : 'json', normalizedRows: rows.length },
    });
  }

  private async parseXlsx(
    filePath: string,
    originalName: string,
    mimeType: string,
    connectorType: string,
  ): Promise<ParsedDataProfile> {
    const buffer = await readFile(filePath);
    const entries = readZipEntries(buffer);
    const sharedStrings = parseSharedStrings(entries.find((entry) => entry.name === 'xl/sharedStrings.xml')?.data);
    const sheetEntry =
      entries.find((entry) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(entry.name)) ??
      entries.find((entry) => entry.name.endsWith('.xml'));

    if (!sheetEntry) {
      return this.metadataOnly(filePath, originalName, mimeType, 'xlsx', connectorType, {
        warning: 'Workbook contains no readable worksheet XML.',
      });
    }

    const rows = parseWorksheetRows(sheetEntry.data.toString('utf8'), sharedStrings);
    const header = rows[0]?.map((value, index) => String(value || `column_${index + 1}`)) ?? [];
    const previewRows = rows.slice(1, MAX_PREVIEW_ROWS + 1).map((row) =>
      Object.fromEntries(header.map((column, index) => [column, row[index] ?? ''])),
    );

    return buildProfile({
      connectorType,
      format: 'xlsx',
      originalName,
      mimeType,
      recordCount: Math.max(rows.length - 1, 0),
      columns: header,
      previewRows,
      metadata: {
        parser: 'xlsx-ooxml',
        worksheet: sheetEntry.name,
        zipEntries: entries.length,
      },
    });
  }

  private async parseXml(
    filePath: string,
    originalName: string,
    mimeType: string,
    connectorType: string,
  ): Promise<ParsedDataProfile> {
    const content = await readFile(filePath, 'utf8');
    const rows = parseRepeatingXmlRows(content);
    const previewRows = rows.slice(0, MAX_PREVIEW_ROWS);
    const columns = collectColumns(previewRows);

    return buildProfile({
      connectorType,
      format: 'xml',
      originalName,
      mimeType,
      recordCount: rows.length,
      columns,
      previewRows,
      metadata: { parser: 'xml-lightweight' },
    });
  }

  private async parseZip(
    filePath: string,
    originalName: string,
    mimeType: string,
    connectorType: string,
  ): Promise<ParsedDataProfile> {
    const entries = readZipEntries(await readFile(filePath));
    const inventory = entries.map((entry) => ({
      name: entry.name,
      extension: getExtension(entry.name),
      compressedSize: entry.compressedSize,
      uncompressedSize: entry.uncompressedSize,
      readable: [0, 8].includes(entry.compressionMethod),
    }));

    const parsedChildren: ParsedDataProfile[] = [];
    for (const entry of entries) {
      if (parsedChildren.length >= 8 || ![0, 8].includes(entry.compressionMethod)) continue;
      const childFormat = detectFormat(getExtension(entry.name), '', entry.name);
      if (!['csv', 'tsv', 'txt', 'json', 'jsonl', 'geojson', 'fhir', 'xml', 'xlsx'].includes(childFormat)) continue;

      try {
        parsedChildren.push(await this.parseBuffer(entry.data, entry.name, childFormat));
      } catch {
        // Keep ZIP parsing tolerant. One bad child should not block the whole archive profile.
      }
    }

    const firstTabular = parsedChildren.find((child) => child.previewRowsJson?.length);
    return {
      connectorType,
      format: 'zip',
      recordCount: firstTabular?.recordCount ?? entries.length,
      columnCount: firstTabular?.columnCount,
      schemaJson: firstTabular?.schemaJson,
      previewRowsJson: firstTabular?.previewRowsJson,
      metadataJson: {
        parser: 'zip',
        originalName,
        mimeType,
        fileCount: entries.length,
        inventory: inventory.slice(0, 500),
        parsedChildren: parsedChildren.map((child) => ({
          format: child.format,
          recordCount: child.recordCount,
          columnCount: child.columnCount,
          metadata: child.metadataJson,
        })),
      },
    };
  }

  private async parseBuffer(buffer: Buffer, originalName: string, format: string): Promise<ParsedDataProfile> {
    if (['csv', 'tsv', 'txt'].includes(format)) {
      const delimiter = format === 'tsv' ? '\t' : ',';
      const lines = buffer.toString('utf8').split(/\r?\n/).filter((line) => line.trim().length > 0);
      const header = lines[0] ? parseDelimitedLine(lines[0], delimiter).map((value, index) => value || `column_${index + 1}`) : [];
      const previewRows = lines.slice(1, MAX_PREVIEW_ROWS + 1).map((line) => {
        const values = parseDelimitedLine(line, delimiter);
        return Object.fromEntries(header.map((column, index) => [column, values[index] ?? '']));
      });
      return buildProfile({
        connectorType: classifySourceConnector({ url: originalName, format }),
        format,
        originalName,
        mimeType: 'application/octet-stream',
        recordCount: Math.max(lines.length - 1, 0),
        columns: header,
        previewRows,
        metadata: { parser: 'zip-child-delimited' },
      });
    }

    if (['json', 'jsonl', 'geojson', 'fhir'].includes(format)) {
      const content = buffer.toString('utf8');
      const rows =
        format === 'jsonl'
          ? content
              .split(/\r?\n/)
              .filter(Boolean)
              .map((line) => JSON.parse(line))
          : normalizeJsonRows(JSON.parse(content));
      const previewRows = rows.slice(0, MAX_PREVIEW_ROWS).map((row) => flattenObject(row));
      return buildProfile({
        connectorType: classifySourceConnector({ url: originalName, format }),
        format,
        originalName,
        mimeType: 'application/octet-stream',
        recordCount: rows.length,
        columns: collectColumns(previewRows),
        previewRows,
        metadata: { parser: 'zip-child-json' },
      });
    }

    if (format === 'xml') {
      const rows = parseRepeatingXmlRows(buffer.toString('utf8'));
      const previewRows = rows.slice(0, MAX_PREVIEW_ROWS);
      return buildProfile({
        connectorType: 'XML_FILE',
        format,
        originalName,
        mimeType: 'application/octet-stream',
        recordCount: rows.length,
        columns: collectColumns(previewRows),
        previewRows,
        metadata: { parser: 'zip-child-xml' },
      });
    }

    throw new Error(`Unsupported ZIP child format: ${format}`);
  }

  private async metadataOnly(
    filePath: string,
    originalName: string,
    mimeType: string,
    format: string,
    connectorType: string,
    metadata: Record<string, unknown> = {},
  ): Promise<ParsedDataProfile> {
    const fileStats = await stat(filePath);
    return {
      connectorType,
      format,
      recordCount: 1,
      columnCount: 5,
      schemaJson: [
        { name: 'file_name', type: 'text', nullable: false },
        { name: 'format', type: 'text', nullable: false },
        { name: 'mime_type', type: 'text', nullable: true },
        { name: 'size_bytes', type: 'number', nullable: false },
        { name: 'parser_status', type: 'text', nullable: false },
      ],
      previewRowsJson: [
        {
          file_name: originalName,
          format,
          mime_type: mimeType || 'application/octet-stream',
          size_bytes: fileStats.size,
          parser_status: 'metadata_only',
        },
      ],
      metadataJson: {
        parser: 'metadata-only',
        originalName,
        mimeType,
        sizeBytes: fileStats.size,
        ...metadata,
      },
    };
  }
}

function getExtension(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.nii.gz')) return 'nii.gz';
  const extension = path.extname(lower).replace(/^\./, '');
  return extension || 'unknown';
}

function detectFormat(extension: string, mimeType: string, originalName: string) {
  const lowerName = originalName.toLowerCase();
  const lowerMime = mimeType.toLowerCase();
  if (lowerName.endsWith('.nii.gz')) return 'nii.gz';
  if (extension === 'json' && lowerName.endsWith('.geojson')) return 'geojson';
  if (extension === 'json' && (lowerName.includes('fhir') || lowerMime.includes('fhir'))) return 'fhir';
  if (extension === 'txt') return 'txt';
  return extension;
}

function parseDelimitedLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function normalizeJsonRows(data: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(data)) return data as Array<Record<string, unknown>>;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.entry)) return record.entry as Array<Record<string, unknown>>;
    if (Array.isArray(record.features)) return record.features as Array<Record<string, unknown>>;
    for (const value of Object.values(record)) {
      if (Array.isArray(value)) return value as Array<Record<string, unknown>>;
    }
    return [record];
  }
  return [];
}

function flattenObject(value: unknown, prefix = ''): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? { [prefix]: value } : { value };
  }

  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      Object.assign(output, flattenObject(child, nextKey));
    } else {
      output[nextKey] = Array.isArray(child) ? JSON.stringify(child) : child;
    }
  }
  return output;
}

function collectColumns(rows: Array<Record<string, unknown>>) {
  return Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set<string>()));
}

function buildProfile(input: {
  connectorType: string;
  format: string;
  originalName: string;
  mimeType: string;
  recordCount: number;
  columns: string[];
  previewRows: Array<Record<string, unknown>>;
  metadata: Record<string, unknown>;
}): ParsedDataProfile {
  return {
    connectorType: input.connectorType,
    format: input.format,
    recordCount: input.recordCount,
    columnCount: input.columns.length,
    schemaJson: input.columns.map((name) => ({ name, type: inferColumnType(input.previewRows, name), nullable: true })),
    previewRowsJson: input.previewRows,
    metadataJson: {
      originalName: input.originalName,
      mimeType: input.mimeType,
      ...input.metadata,
    },
  };
}

function inferColumnType(rows: Array<Record<string, unknown>>, column: string) {
  const samples = rows.map((row) => row[column]).filter((value) => value !== null && value !== undefined && value !== '');
  if (!samples.length) return 'text';
  if (samples.every((value) => Number.isFinite(Number(value)))) return 'number';
  if (samples.every((value) => ['true', 'false'].includes(String(value).toLowerCase()))) return 'boolean';
  if (samples.every((value) => !Number.isNaN(Date.parse(String(value))))) return 'date';
  return 'text';
}

function readZipEntries(buffer: Buffer) {
  const entries: ZipEntry[] = [];
  let offset = 0;

  while (offset + 30 < buffer.length && buffer.readUInt32LE(offset) === 0x04034b50) {
    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const uncompressedSize = buffer.readUInt32LE(offset + 22);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + fileNameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    const name = buffer.subarray(nameStart, nameStart + fileNameLength).toString('utf8');

    if (!name.endsWith('/') && dataEnd <= buffer.length) {
      const compressed = buffer.subarray(dataStart, dataEnd);
      let data = Buffer.alloc(0);
      try {
        data =
          compressionMethod === 0
            ? Buffer.from(compressed)
            : compressionMethod === 8
              ? inflateRawSync(compressed)
              : Buffer.alloc(0);
      } catch {
        data = Buffer.alloc(0);
      }
      entries.push({ name, compressionMethod, compressedSize, uncompressedSize, data });
    }

    offset = dataEnd;
  }

  return entries;
}

function parseSharedStrings(xmlBuffer?: Buffer) {
  if (!xmlBuffer) return [];
  const xml = xmlBuffer.toString('utf8');
  return Array.from(xml.matchAll(/<si[^>]*>([\s\S]*?)<\/si>/g)).map((match) =>
    stripXml(match[1].replace(/<\/t>\s*<t[^>]*>/g, '')),
  );
}

function parseWorksheetRows(xml: string, sharedStrings: string[]) {
  return Array.from(xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)).map((rowMatch) => {
    const cells = Array.from(rowMatch[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g));
    const row: string[] = [];
    cells.forEach((cellMatch) => {
      const attrs = cellMatch[1];
      const cellXml = cellMatch[2];
      const refMatch = attrs.match(/\sr="([A-Z]+)(\d+)"/);
      const index = refMatch ? columnLettersToIndex(refMatch[1]) : row.length;
      const valueMatch = cellXml.match(/<v[^>]*>([\s\S]*?)<\/v>/);
      const inlineMatch = cellXml.match(/<t[^>]*>([\s\S]*?)<\/t>/);
      const raw = valueMatch?.[1] ?? inlineMatch?.[1] ?? '';
      row[index] = attrs.includes('t="s"') ? sharedStrings[Number(raw)] ?? raw : stripXml(raw);
    });
    return row;
  });
}

function columnLettersToIndex(letters: string) {
  return letters.split('').reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function parseRepeatingXmlRows(xml: string) {
  const matches = Array.from(xml.matchAll(/<([A-Za-z_][\w:.-]*)\b[^>]*>([\s\S]*?)<\/\1>/g));
  const groups = new Map<string, RegExpMatchArray[]>();
  matches.forEach((match) => {
    const tag = match[1];
    if (!groups.has(tag)) groups.set(tag, []);
    groups.get(tag)?.push(match);
  });
  const repeating = Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length)[0]?.[1] ?? [];
  return repeating.slice(0, 500).map((match) => {
    const row: Record<string, unknown> = {};
    Array.from(match[2].matchAll(/<([A-Za-z_][\w:.-]*)\b[^>]*>([^<]*)<\/\1>/g)).forEach((child) => {
      row[child[1]] = stripXml(child[2]);
    });
    return Object.keys(row).length ? row : { value: stripXml(match[2]) };
  });
}

function stripXml(value: string) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}
