import os from 'os';
import { IncomingMessage } from 'http';
import multiparty from 'multiparty';

interface File {
  originalFilename: string;
  path: string;
  headers: {
    'content-disposition': string;
    'content-type': string;
  };
  size: number;
}

function parseFormdata<FieldName extends string, FileName extends string>(
  req: IncomingMessage,
  {
    maxFilesSize = 100 * 1024 * 1024,
  }: {
    maxFilesSize?: number;
  } = {},
) {
  const form = new multiparty.Form({ uploadDir: os.tmpdir(), maxFilesSize });
  return new Promise<{
    field: {
      [key in FieldName]?: string[];
    };
    file: {
      [key in FileName]?: File[];
    };
  }>((resolve, reject) =>
    form.parse(req, (error, field, file) =>
      error
        ? reject(error)
        : resolve({
            field,
            file,
          }),
    ),
  );
}

export default parseFormdata;
