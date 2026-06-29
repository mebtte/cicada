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
  getServerOriginKey,
  normalizeServerOriginInput,
} from '../utils';
import { isKeyboardEventComposing } from '@/utils/keyboard';

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
  const [checkingOrigin, setCheckingOrigin] = useState<string>();
  const busy = loading || !!checkingOrigin;
  const [origin, setOrigin] = useState(
    () => useServer.getState().selectedServerOrigin || window.location.origin,
  );
  const [originError, setOriginError] = useState<string>();
  const onOriginChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setOrigin(event.target.value);
    setOriginError(undefined);
  };

  const onSaveOrigin = async () => {
    if (busy) return;

    const normalized = normalizeServerOriginInput(origin);
    if (normalized.origin !== origin) {
      setOrigin(normalized.origin);
    }
    if (!normalized.ok) {
      setOriginError(normalized.error);
      return;
    }

    const nextOrigin = normalized.origin;
    setOriginError(undefined);
    setLoading(true);
    try {
      const existedServer = useServer
        .getState()
        .serverList.find((s) => getServerOriginKey(s.origin) === nextOrigin);
      const { default: getMetadata } = await import(
        '@/server/base/get_metadata'
      );
      const metadata = await getMetadata(nextOrigin);
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
          selectedServerOrigin: nextOrigin,
          serverList: server.serverList.map((s) =>
            getServerOriginKey(s.origin) === nextOrigin
              ? {
                  ...s,
                  version: metadata.version,
                  hostname: metadata.hostname,
                  imageFileMaxSize: metadata.imageFileMaxSize,
                  audioFileMaxSize: metadata.audioFileMaxSize,
                  videoFileMaxSize: metadata.videoFileMaxSize,
                  origin: nextOrigin,
                }
              : s,
          ),
        }));
      } else {
        useServer.setState((server) => ({
          selectedServerOrigin: nextOrigin,
          serverList: [
            ...server.serverList,
            {
              version: metadata.version,
              hostname: metadata.hostname,
              imageFileMaxSize: metadata.imageFileMaxSize,
              audioFileMaxSize: metadata.audioFileMaxSize,
              videoFileMaxSize: metadata.videoFileMaxSize,
              origin: nextOrigin,
              users: [],
              selectedUserId: undefined,
            },
          ],
        }));
      }
      toNext();
    } catch (error) {
      logger.error(error, `Failed to get origin "${nextOrigin}" metadata`);
      dialog.alert({ content: getServerMetadataErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (!isKeyboardEventComposing(event) && event.key === 'Enter') {
      onSaveOrigin();
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
        checkingOrigin={checkingOrigin}
        onCheckingOriginChange={setCheckingOrigin}
      />
      <Input
        label={t('origin')}
        type="url"
        disabled={busy}
        value={origin}
        error={originError}
        onChange={onOriginChange}
        onKeyDown={onKeyDown}
        autoFocus
      />
      <Button
        variant={'primary'}
        onClick={onSaveOrigin}
        disabled={!origin.trim().length || busy}
        loading={loading}
      >
        {t('add_origin')}
      </Button>
    </Style>
  );
}

export default FirstStep;
