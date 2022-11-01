import { ExceptionCode } from '#/constants/exception';
import token from '@/global_states/token';
import setting from '@/global_states/setting';
import ErrorWithCode from '@/utils/error_with_code';
import sleep from '#/utils/sleep';
import env from '@/env';
import { Query } from '@/constants';

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
  minDuration = 500,
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
    [Query.VERSION]: env.VERSION,
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

  let response: Response;
  try {
    [response] = await Promise.all([
      window.fetch(url, {
        method,
        headers,
        body: processedBody,
      }),
      sleep(minDuration),
    ]);
  } catch (error) {
    throw new Error('网络错误');
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
      case ExceptionCode.NOT_AUTHORIZE: {
        token.set('');
        break;
      }
    }

    throw new ErrorWithCode(`${message}(#${code})`, code);
  }

  return data as Data;
}
