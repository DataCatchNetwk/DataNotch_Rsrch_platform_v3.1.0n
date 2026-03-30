import { Global, Module } from '@nestjs/common';
import { CsvFileReader } from './readers/csv-file.reader';
import { XlsxFileReader } from './readers/xlsx-file.reader';
import { FileReaderRegistry } from './readers/file-reader.registry';
import { DatasetReadWorker } from './dataset-read.worker';

@Global()
@Module({
  providers: [CsvFileReader, XlsxFileReader, FileReaderRegistry, DatasetReadWorker],
  exports: [CsvFileReader, XlsxFileReader, FileReaderRegistry, DatasetReadWorker],
})
export class WorkersModule {}
