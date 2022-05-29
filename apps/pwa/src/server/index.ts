import axios, { AxiosResponse } from 'axios';
import setting from '@/setting';
import sleep from '#/utils/sleep';
import token from '@/global_state/token';
import ErrorWithCode from '@/utils/error_with_code';

export enum Code {
  SUCCESS = 0,
  NOT_AUTHORIZE = 100004,
}

enum METHOD {
  GET = 'get',
  POST = 'post',
}

function generateMethod(method: METHOD) {
  return async <DataType>(
    path: string,
    {
      params,
      data,
      timeout = 1000 * 30,
      withToken = false,
      defer = 1000,
      headers,
    }: {
      params?: { [key: string]: string | number | undefined };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data?: any;
      timeout?: number;
      withToken?: boolean;
      /** 请求最短持续时间 */
      defer?: number;
      headers?: { [key: string]: string };
    } = {},
  ) => {
    if (withToken) {
      // eslint-disable-next-line no-param-reassign
      headers = {
        ...headers,
        authorization: token.get(),
      };
    }

    let response: AxiosResponse;
    try {
      [response] = await Promise.all([
        axios({
          url: `${setting.getServerAddress()}${path}`,
          method,
          timeout,
          params,
          data,
          headers,
        }),
        sleep(defer),
      ]);
    } catch (error) {
      ({ response } = error);
      if (!response) {
        throw error;
      }
    }

    const { status, statusText } = response;
    if (status !== 200 || !response.data) {
      throw new ErrorWithCode(`${statusText}(#${status})`, status);
    }

    const {
      code,
      message,
      data: responseData,
    } = response.data as {
      code: Code;
      message: string;
      data: DataType;
    };
    if (code !== Code.SUCCESS) {
      // 未登录/登录过期
      if (code === Code.NOT_AUTHORIZE) {
        token.set('');
      }
      throw new ErrorWithCode(`${message}(#${code})`, code);
    }
    return responseData;
  };
}

export default {
  get: generateMethod(METHOD.GET),
  post: generateMethod(METHOD.POST),
};
