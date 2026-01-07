import styled from 'styled-components';
import { DownloadingMusic, DownloadStatus } from '../constants';
import { useMemo } from 'react';
import Button, { Variant } from '@/components/button';
import { t } from '@/i18n';

const Style = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  padding: 20px;
`;

function Toolbar({
  downloadingMusicList,
  cleanAll,
  cleanSuccessful,
  retryFailed,
  onClose,
}: {
  onClose: () => void;
  downloadingMusicList: DownloadingMusic[];
  cleanAll: () => void;
  cleanSuccessful: () => void;
  retryFailed: () => void;
}) {
  const hasSuccess = useMemo(
    () =>
      !!downloadingMusicList.find(
        (m) => m.status === DownloadStatus.SUCCESSFUL,
      ),
    [downloadingMusicList],
  );
  const hasFailure = useMemo(
    () =>
      !!downloadingMusicList.find((m) => m.status === DownloadStatus.FAILED),
    [downloadingMusicList],
  );
  return (
    <Style>
      {hasSuccess ? (
        <Button
          variant={Variant.PRIMARY}
          onClick={() => {
            onClose();
            globalThis.setTimeout(cleanSuccessful);
          }}
        >
          {t('clean_successful_items')}
        </Button>
      ) : null}
      <Button
        disabled={!hasFailure}
        variant={Variant.DANGER}
        onClick={retryFailed}
      >
        {t('retry_failed_items')}
      </Button>
      <Button
        onClick={() => {
          onClose();
          globalThis.setTimeout(cleanAll);
        }}
      >
        {t('clean_all_items')}
      </Button>
    </Style>
  );
}

export default Toolbar;
