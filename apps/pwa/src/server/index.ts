import { ExceptionCode } from '#/constants/exception';
import token from '@/global_states/token';
import setting, { prefixServerOrigin } from '@/global_states/setting';
import ErrorWithCode from '@/utils/error_with_code';
import sleep from '#/utils/sleep';
import definition from '@/definition';
import { NORMAL_REQUEST_MINIMAL_DURATION } from '@/constants';
import timeoutFn from '#/utils/timeout';
import { CommonQuery } from '#/constants';

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
  requestMinimalDuration = NORMAL_REQUEST_MINIMAL_DURATION,
  timeout = 10 * 1000,
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
  requestMinimalDuration?: number;
  timeout?: number;
}) {
  let url = prefixServerOrigin(path);

  const combineParams = {
    ...params,
    [CommonQuery.VERSION]: definition.VERSION,
    [CommonQuery.LANGUAGE]: setting.get().language,
  };
  url += `?${Object.keys(combineParams)
    .map(
      (key) =>
        `${window.encodeURIComponent(key)}=${window.encodeURIComponent(
          combineParams[key],
        )}`,
    )
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

  let response: Response;
  try {
    [response] = await Promise.race([
      Promise.all([
        window.fetch(url, {
          method,
          headers,
          body: processedBody,
        }),
        sleep(requestMinimalDuration),
      ]),
      timeoutFn(timeout),
    ]);
  } catch (error) {
    throw new Error('暂时无法连接到服务器');
  }

  const { status, statusText } = response;
  if (status !== 200) {
    throw new ErrorWithCode(`${statusText}(#${status})`, status);
  }

  const {
    code,
    message,
    data,
  }: {
    code: ExceptionCode;
    message: string;
    data: Data;
  } = await response.json();

  if (code !== ExceptionCode.SUCCESS) {
    switch (code) {
      case ExceptionCode.NOT_AUTHORIZED: {
        token.set('');
        break;
      }
    }

    throw new ErrorWithCode(`${message}(#${code})`, code);
  }

  return data as Data;
}
