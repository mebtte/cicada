import React, { useContext } from 'react';

import { RequestStatus } from '@/constants';
import LoadingCard from '@/components/loading_card';
import ErrorCard from '@/components/error_card';
import Drawer, { Title } from '@/components/drawer';
import MusicbillList from './musicbill_list';
import eventemitter, { EventType } from '../eventemitter';
import Context from '../context';
import MusicInfo from '../components/music_info';
import { Music as MusicType } from '../constants';

const bodyProps = {
  style: {
    width: 300,
    display: 'flex',
    flexDirection: 'column' as 'column',
  },
};
const musicInfoStyle = {
  padding: '0 20px',
  marginBottom: 20,
};
const cardStyle = {
  flex: 1,
};
const reloadMusicbillList = () =>
  eventemitter.emit(EventType.RELOAD_MUSICBILL_LIST);

const MusicbillListDrawer = ({
  open,
  onClose,
  music,
}: {
  open: boolean;
  onClose: () => void;
  music: MusicType;
}) => {
  const { getMusicbillListStatus: status, musicbillList } = useContext(Context);

  let content = null;
  if (status === RequestStatus.SUCCESS) {
    content = <MusicbillList music={music} musicbillList={musicbillList} />;
  } else if (status === RequestStatus.LOADING) {
    content = <LoadingCard message="正在获取歌单列表..." style={cardStyle} />;
  } else {
    content = (
      <ErrorCard
        errorMessage="获取歌单列表失败"
        retry={reloadMusicbillList}
        style={cardStyle}
      />
    );
  }
  return (
    <Drawer open={open} onClose={onClose} bodyProps={bodyProps}>
      <Title>添加到歌单</Title>
      <MusicInfo music={music} style={musicInfoStyle} />
      {content}
    </Drawer>
  );
};

export default React.memo(MusicbillListDrawer);
