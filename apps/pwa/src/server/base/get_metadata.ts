import { ExceptionCode } from '#/constants/exception';
import { Response } from '#/server/base/get_metadata';
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
    throw new Error(`${statusText}(#${status})`);
  }
  const { code, message, data } = (await response.json()) as {
    code: ExceptionCode;
    message: string;
    data: Response;
  };
  if (code !== ExceptionCode.SUCCESS) {
    throw new Error(`${message}(#${code})`);
  }
  return data;
}

export default getMetadata;
