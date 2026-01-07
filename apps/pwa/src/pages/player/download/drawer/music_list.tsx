import styled from 'styled-components';
import {
  DownloadingMusic,
  DownloadStatus as DownloadStatusType,
} from '../constants';
import List from 'react-list';
import MusicBase from '../../components/music_base';
import {
  MdAccessTime,
  MdDownloadDone,
  MdOutlineWarningAmber,
} from 'react-icons/md';
import { CSSProperties } from 'react';
import { CSSVariable } from '@/global_style';
import Spinner from '@/components/spinner';

const Style = styled.div`
  flex: 1;
  min-height: 0;

  overflow: auto;
`;
const DOWNLOAD_STATUS_SIZE = 16;
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
      return <MdDownloadDone style={successfulStyle} />;
    }
    case DownloadStatusType.FAILED: {
      return <MdOutlineWarningAmber style={failedStyle} />;
    }
    default: {
      return null;
    }
  }
}

function MusicList({
  downloadingMusicList,
}: {
  downloadingMusicList: DownloadingMusic[];
}) {
  const length = downloadingMusicList.length;
  return (
    <Style>
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
              lineAfter={<DownloadStatus downloadingMusic={downloadingMusic} />}
            />
          );
        }}
      />
    </Style>
  );
}

export default MusicList;
