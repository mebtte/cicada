import { ExceptionCode } from '#/constants/exception';
import token from '@/global_state/token';
import setting from '@/global_state/setting';
import ErrorWithCode from '@/utils/error_with_code';
import sleep from '#/utils/sleep';
import env from '@/env';

export enum Method {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  PATCH = 'patch',
  DELETE = 'delete',
}

export async function request<Data = void>({
  path,
  method = Method.GET,
  params,
  body,
  headers = {},
  withToken = false,
  minDuration = 1000,
}: {
  path: string;
  method?: Method;
  params?: {
    [key: string]: string | number | undefined;
  };
  body?: FormData | { [key: string]: unknown };
  headers?: {
    [key: string]: string;
  };
  withToken?: boolean;
  minDuration?: number;
}) {
  const { serverAddress } = setting.get();
  let url = `${serverAddress}${path}`;

  const combineParams = {
    ...params,
    version: env.VERSION,
  };
  url += `?${Object.keys(combineParams)
    .map((key) => `${key}=${combineParams[key]}`)
    .join('&')}`;

  if (withToken) {
    // eslint-disable-next-line no-param-reassign
    headers.authorization = token.get();
  }

  let processedBody: FormData | string | null = null;
  if (body) {
    if (body instanceof FormData) {
      processedBody = body;
    } else {
      processedBody = JSON.stringify(body);
      // eslint-disable-next-line no-param-reassign
      headers['Content-Type'] = 'application/json';
    }
  }

  const [response] = await Promise.all([
    window.fetch(url, {
      method,
      headers,
      body: processedBody,
    }),
    sleep(minDuration),
  ]);

  const { status, statusText } = response;
  if (status !== 200) {
    throw new Error(`${statusText}(#${status})`);
  }

  const { code, message, data } = (await response.json()) as {
    code: ExceptionCode;
    message: string;
    data: Data;
  };

  if (code !== ExceptionCode.SUCCESS) {
    if (code === ExceptionCode.NOT_AUTHORIZE) {
      token.set('');
    }
    throw new ErrorWithCode(`${message}(#${code})`, code);
  }

  return data as Data;
}
