import { ExceptionCode } from '#/constants/exception';
import { type Response } from '#/server/base/get_metadata';
import ErrorWithCode from '@/utils/error_with_code';
import { getCommonParams } from '..';

async function getMetadata(origin: string) {
  const commonParams = getCommonParams();
  const response = await window.fetch(
    `${origin}/base/metadata?${Object.keys(commonParams)
      .map((key) => `${key}=${commonParams[key]}`)
      .join('&')}`,
  );
  const { status, statusText } = response;
  if (status !== 200) {
    throw new ErrorWithCode(statusText, status);
  }
  const {
    code,
    message,
    data,
  }: {
    code: ExceptionCode;
    message: string;
    data: Response;
  } = await response.json();
  if (code !== ExceptionCode.SUCCESS) {
    throw new ErrorWithCode(message, code);
  }
  return data;
}

export default getMetadata;
