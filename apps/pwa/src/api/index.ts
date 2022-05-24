import { ExceptionCode } from '#/constants/exception';
import token from '@/global_state/token';
import setting from '@/setting';
import ErrorWithCode from '@/utils/error_with_code';

export enum Method {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  PATCH = 'patch',
  DELETE = 'delete',
}

export async function request<Data>({
  path,
  method = Method.GET,
  params,
  body,
  headers = {},
  withToken = false,
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
}) {
  const serverAddress = setting.getServerAddress();
  let url = `${serverAddress}${path}`;

  if (params) {
    url += `?${Object.keys(params)
      .map((key) => `${key}=${params[key]}`)
      .join('&')}`;
  }

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

  const response = await window.fetch(url, {
    method,
    headers,
    body: processedBody,
  });

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
