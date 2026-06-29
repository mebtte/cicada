import Button from '@/components/button';
import { OfflineDownload } from '@/components/icon';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { isAudioAssetCacheEnabled } from '@/utils/audio_asset_cache';
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '@/i18n';
import { buttonItemStyle } from './constants';

function OfflineCache() {
  const navigate = useNavigate();

  if (!isAudioAssetCacheEnabled()) {
    return null;
  }

  return (
    <Button
      variant={'ghost'}
      style={buttonItemStyle}
      icon={<OfflineDownload size={16} aria-hidden="true" />}
      disableHoverLift
      onClick={() => navigate(ROOT_PATH.PLAYER + PLAYER_PATH.OFFLINE_CACHE)}
    >
      {t('offline_cache')}
    </Button>
  );
}

export default memo(OfflineCache);
