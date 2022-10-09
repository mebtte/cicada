import Spinner from '#/components/spinner';
import { useContext } from 'react';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import { RequestStatus } from '@/constants';
import Context from '../../context';
import e, { EventType } from '../../eventemitter';
import Musicbill from './musicbill';

const reloadMusicbillList = () => e.emit(EventType.RELOAD_MUSICBILL_LIST, null);
const Style = styled.div``;
const LoadingBox = styled.div`
  padding: 20px;
`;

function MusicbillList() {
  const { getMusicbillListStatus, musicbillList } = useContext(Context);

  if (getMusicbillListStatus === RequestStatus.SUCCESS) {
    return (
      <Style>
        {musicbillList.map((m) => (
          <Musicbill key={m.id} musicbill={m} />
        ))}
      </Style>
    );
  }
  if (getMusicbillListStatus === RequestStatus.LOADING) {
    return (
      <LoadingBox>
        <Spinner />
      </LoadingBox>
    );
  }
  if (getMusicbillListStatus === RequestStatus.ERROR) {
    return (
      <ErrorCard errorMessage="获取乐单列表失败" retry={reloadMusicbillList} />
    );
  }
  return null;
}

export default MusicbillList;
