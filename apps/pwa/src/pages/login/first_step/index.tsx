import { ChangeEventHandler, KeyboardEventHandler, useState } from 'react';
import styled from 'styled-components';
import Input from '@/components/input';
import logger from '@/utils/logger';
import Button from '@/components/button';
import { t } from '@/i18n';
import Logo from '../logo';
import Language from './language';
import ServerList from './server_list';
import { useServer } from '@/global_states/server';
import { Divider } from '@/components';
import definition from '@/definition';
import { isServerVersionSupported } from '@/utils/version';
import dialog from '@/utils/dialog';
import {
  getServerMetadataErrorMessage,
  normalizeServerBaseURLInput,
} from '../utils';
import { isKeyboardEventComposing } from '@/utils/keyboard';
import { APP_BASE_URL } from '@/constants/app';

const Style = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  -webkit-app-region: no-drag;
`;

function FirstStep({
  toNext,
  onManage: _onManage,
}: {
  toNext: () => void;
  onManage: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [checkingBaseURL, setCheckingBaseURL] = useState<string>();
  const busy = loading || !!checkingBaseURL;
  const [baseURL, setBaseURL] = useState(
    () => useServer.getState().selectedServerBaseURL || APP_BASE_URL.replace(/\/$/, ''),
  );
  const [baseURLError, setBaseURLError] = useState<string>();
  const onBaseURLChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setBaseURL(event.target.value);
    setBaseURLError(undefined);
  };

  const onSaveBaseURL = async () => {
    if (busy) return;

    const normalized = normalizeServerBaseURLInput(baseURL);
    if (normalized.baseURL !== baseURL) {
      setBaseURL(normalized.baseURL);
    }
    if (!normalized.ok) {
      setBaseURLError(normalized.error);
      return;
    }

    const nextBaseURL = normalized.baseURL;
    setBaseURLError(undefined);
    setLoading(true);
    try {
      const existedServer = useServer
        .getState()
        .serverList.find((s) => s.baseURL === nextBaseURL);
      const { default: getMetadata } = await import(
        '@/server/base/get_metadata'
      );
      const metadata = await getMetadata(nextBaseURL);
      if (!isServerVersionSupported(definition.VERSION, metadata.version)) {
        dialog.alert({
          content: t(
            'server_version_unsupported',
            definition.VERSION,
            metadata.version,
          ),
        });
        return;
      }
      if (existedServer) {
        useServer.setState((server) => ({
          selectedServerBaseURL: nextBaseURL,
          serverList: server.serverList.map((s) =>
            s.baseURL === nextBaseURL
              ? {
                  ...s,
                  version: metadata.version,
                  hostname: metadata.hostname,
                  imageFileMaxSize: metadata.imageFileMaxSize,
                  audioFileMaxSize: metadata.audioFileMaxSize,
                  videoFileMaxSize: metadata.videoFileMaxSize,
                  baseURL: nextBaseURL,
                }
              : s,
          ),
        }));
      } else {
        useServer.setState((server) => ({
          selectedServerBaseURL: nextBaseURL,
          serverList: [
            ...server.serverList,
            {
              version: metadata.version,
              hostname: metadata.hostname,
              imageFileMaxSize: metadata.imageFileMaxSize,
              audioFileMaxSize: metadata.audioFileMaxSize,
              videoFileMaxSize: metadata.videoFileMaxSize,
              baseURL: nextBaseURL,
              users: [],
              selectedUserId: undefined,
            },
          ],
        }));
      }
      toNext();
    } catch (error) {
      logger.error(error, `Failed to get server "${nextBaseURL}" metadata`);
      dialog.alert({ content: getServerMetadataErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (!isKeyboardEventComposing(event) && event.key === 'Enter') {
      onSaveBaseURL();
    }
  };

  return (
    <Style>
      <Logo />
      <Language disabled={busy} />
      <Divider />
      <ServerList
        toNext={toNext}
        disabled={loading}
        checkingBaseURL={checkingBaseURL}
        onCheckingBaseURLChange={setCheckingBaseURL}
      />
      <Input
        label={t('server_address')}
        type="url"
        disabled={busy}
        value={baseURL}
        error={baseURLError}
        onChange={onBaseURLChange}
        onKeyDown={onKeyDown}
        autoFocus
      />
      <Button
        variant={'primary'}
        onClick={onSaveBaseURL}
        disabled={!baseURL.trim().length || busy}
        loading={loading}
      >
        {t('add_server')}
      </Button>
    </Style>
  );
}

export default FirstStep;
