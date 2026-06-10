import { ExceptionCode } from '@/constants/exception';
import ErrorWithCode from '@/utils/error_with_code';
import { t } from '@/i18n';
import timeout from '@/utils/timeout';
import { getCommonParams } from '..';

interface Response {
  version: string;
  hostname: string;
  musicFileMaxSize: number;
  imageFileMaxSize: number;
}

const METADATA_TIMEOUT_MS = 10 * 1000;

async function getMetadata(origin: string) {
  const commonParams = getCommonParams();
  const url = `${origin}/base/metadata?${Object.keys(commonParams)
    .map((key) => `${key}=${commonParams[key]}`)
    .join('&')}`;

  const controller = new AbortController();
  const response = await Promise.race([
    window.fetch(url, { signal: controller.signal }).catch((error) => {
      throw new Error(t('can_not_connect_to_server_temporarily'), {
        cause: error,
      });
    }),
    timeout(METADATA_TIMEOUT_MS).catch(() => {
      controller.abort();
      throw new Error(t('timeout_while_fetching_data'));
    }),
  ]);
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
