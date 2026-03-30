import { BadRequestException, Injectable } from '@nestjs/common';
import { CsvFileReader } from './csv-file.reader';
import { XlsxFileReader } from './xlsx-file.reader';

@Injectable()
export class FileReaderRegistry {
  constructor(private readonly csv: CsvFileReader, private readonly xlsx: XlsxFileReader) {}

  resolve(filename: string, mimeType?: string) {
    const readers = [this.csv, this.xlsx];
    const reader = readers.find((item) => item.supports(filename, mimeType));
    if (!reader) throw new BadRequestException(`Unsupported file type: ${filename}`);
    return reader;
  }
}
