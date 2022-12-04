import Spinner from '@/components/spinner';
import { flexCenter } from '@/style/flexbox';
import { memo, useContext } from 'react';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import { RequestStatus } from '@/constants';
import Empty from '@/components/empty';
import { Music } from '../constants';
import Context from '../context';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import Musicbill from './musicbill';

const reloadMusicbillList = () =>
  playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL_LIST, null);
const Style = styled.div`
  padding: 10px 0 max(env(safe-area-inset-bottom, 0) + 10px) 0;
`;
const StatusContainer = styled.div`
  ${flexCenter}
  padding: 30px 0;
`;

function MusicbillList({ music }: { music: Music }) {
  const { getMusicbillListStatus, musicbillList } = useContext(Context);
  if (getMusicbillListStatus === RequestStatus.SUCCESS) {
    if (musicbillList.length) {
      return (
        <Style>
          {musicbillList.map((musicbill) => (
            <Musicbill key={musicbill.id} musicbill={musicbill} music={music} />
          ))}
        </Style>
      );
    }
    return (
      <StatusContainer>
        <Empty description="请先创建乐单" />
      </StatusContainer>
    );
  }
  if (getMusicbillListStatus === RequestStatus.ERROR) {
    return (
      <StatusContainer>
        <ErrorCard
          errorMessage="获取乐单列表失败"
          retry={reloadMusicbillList}
        />
      </StatusContainer>
    );
  }
  return (
    <StatusContainer>
      <Spinner />
    </StatusContainer>
  );
}

export default memo(MusicbillList);
