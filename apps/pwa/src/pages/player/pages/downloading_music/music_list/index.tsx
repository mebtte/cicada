import styled from 'styled-components';
import {
  DownloadingMusic,
  DownloadStatus as DownloadStatusType,
  FLOATING_CONTROLLER_SCROLL_SPACE,
} from '../../../constants';
import List from 'react-list';
import MusicBase from '../../../components/music_base';
import {
  MdAccessTime,
  MdOutlineWarningAmber,
  MdClose,
} from 'react-icons/md';
import { IconCheckCircle } from '@/components/icon';
import { CSSProperties, useContext } from 'react';
import { CSSVariable } from '@/global_style';
import Spinner from '@/components/spinner';
import autoScrollbar from '@/style/auto_scrollbar';
import { TOOLBAR_HEIGHT } from '../constants';
import context from '@/pages/player/context';
import Empty from '@/components/empty';
import absoluteFullSize from '@/style/absolute_full_size';
import Button from '@/components/button';
import eventemitter, { EventType } from '@/pages/player/eventemitter';
import dialog from '@/utils/dialog';
import { t } from '@/i18n';

const LineAfter = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;
const Style = styled.div`
  flex: 1;
  min-height: 0;

  position: relative;

  padding: 12px 12px 0;

  ${autoScrollbar}
  overflow: auto;

  &::after {
    content: '';
    display: block;
    height: calc(${TOOLBAR_HEIGHT}px + ${FLOATING_CONTROLLER_SCROLL_SPACE});
  }
`;
const StyledEmpty = styled(Empty)`
  ${absoluteFullSize}
`;
const DOWNLOAD_STATUS_SIZE = 24;
const downloadStatusStyle: CSSProperties = {
  fontSize: DOWNLOAD_STATUS_SIZE,
};
const successfulStyle: CSSProperties = {
  ...downloadStatusStyle,
  color: CSSVariable.COLOR_PRIMARY,
};
const waitingStyle: CSSProperties = {
  ...downloadStatusStyle,
  color: CSSVariable.TEXT_COLOR_SECONDARY,
};
const failedStyle: CSSProperties = {
  ...downloadStatusStyle,
  color: CSSVariable.COLOR_DANGEROUS,
};
const removeStyle: CSSProperties = {
  color: CSSVariable.COLOR_DANGEROUS,
};

function DownloadStatus({
  downloadingMusic,
}: {
  downloadingMusic: DownloadingMusic;
}) {
  const { status } = downloadingMusic;
  switch (status) {
    case DownloadStatusType.DOWNLOADING: {
      return <Spinner size={DOWNLOAD_STATUS_SIZE} />;
    }
    case DownloadStatusType.WAITING: {
      return <MdAccessTime style={waitingStyle} />;
    }
    case DownloadStatusType.SUCCESSFUL: {
      return <IconCheckCircle style={successfulStyle} />;
    }
    case DownloadStatusType.FAILED: {
      return <MdOutlineWarningAmber style={failedStyle} />;
    }
    default: {
      return null;
    }
  }
}

function MusicList() {
  const { downloadingMusicList } = useContext(context);
  const length = downloadingMusicList.length;
  return (
    <Style>
      {length > 0 ? (
        <List
          type="uniform"
          length={length}
          itemRenderer={(index, key) => {
            const downloadingMusic = downloadingMusicList[index];
            return (
              <MusicBase
                key={key}
                index={length - index}
                music={downloadingMusic.music}
                lineAfter={
                  <LineAfter>
                    <DownloadStatus downloadingMusic={downloadingMusic} />
                    <Button
                      square
                      variant="plain"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        const removeItem = () =>
                          eventemitter.emit(
                            EventType.DOWNLOAD_MUSIC_LIST_REMOVE_ITEM,
                            {
                              id: downloadingMusic.id,
                            },
                          );
                        if (
                          downloadingMusic.status ===
                          DownloadStatusType.SUCCESSFUL
                        ) {
                          return removeItem();
                        }
                        return dialog.confirm({
                          content: t('remove_download_item_question'),
                          onConfirm: removeItem,
                        });
                      }}
                    >
                      <MdClose style={removeStyle} />
                    </Button>
                  </LineAfter>
                }
              />
            );
          }}
        />
      ) : (
        <StyledEmpty description={t('no_download')} />
      )}
    </Style>
  );
}

export default MusicList;
