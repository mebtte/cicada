import { ExceptionCode } from '#/constants/exception';
import {
  useServer,
  getSelectedServer,
  getSelectedUser,
} from '@/global_states/server';
import ErrorWithCode from '@/utils/error_with_code';
import sleep from '#/utils/sleep';
import definition from '@/definition';
import { NORMAL_REQUEST_MINIMAL_DURATION } from '@/constants';
import timeoutFn from '#/utils/timeout';
import { CommonQuery } from '#/constants';
import { t } from '@/i18n';
import { useSetting } from '@/global_states/setting';

export enum Method {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  PATCH = 'patch',
  DELETE = 'delete',
}

export function getCommonParams() {
  return {
    [CommonQuery.VERSION]: definition.VERSION,
    [CommonQuery.LANGUAGE]: useSetting.getState().language,
  };
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
  params?: Record<string, string | number | undefined>;
  body?: FormData | Record<string, unknown>;
  headers?: Record<string, string>;
  withToken?: boolean;
  requestMinimalDuration?: number;
  timeout?: number;
}) {
  const selectedServer = getSelectedServer(useServer.getState());
  if (!selectedServer) {
    throw new ErrorWithCode(
      'Not authorized from local',
      ExceptionCode.NOT_AUTHORIZED,
    );
  }

  const selectedUser = getSelectedUser(selectedServer);
  let url = `${selectedServer.origin}${path}`;

  const combineParams = {
    ...params,
    ...getCommonParams(),
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
    if (!selectedUser) {
      throw new ErrorWithCode(
        'Not authorized from local',
        ExceptionCode.NOT_AUTHORIZED,
      );
    }
    // eslint-disable-next-line no-param-reassign
    headers.authorization = selectedUser.token;
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
    throw new Error(t('can_not_connect_to_server_temporarily'));
  }

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
    data: Data;
  } = await response.json();

  if (code !== ExceptionCode.SUCCESS) {
    switch (code) {
      case ExceptionCode.NOT_AUTHORIZED: {
        useServer.setState((server) => ({
          serverList: server.serverList.map((s) =>
            s.origin === selectedServer.origin
              ? {
                  ...s,
                  users: s.users.filter((u) => u.id !== s.selectedUserId),
                  selectedUserId: undefined,
                }
              : s,
          ),
        }));
        break;
      }
    }

    throw new ErrorWithCode(message, code);
  }

  return data;
}
