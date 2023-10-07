import Spinner from '@/components/spinner';
import { flexCenter } from '@/style/flexbox';
import { memo, useContext } from 'react';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import { RequestStatus } from '@/constants';
import Empty from '@/components/empty';
import { t } from '@/i18n';
import { MusicWithSingerAliases } from '../constants';
import Context from '../context';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import Musicbill from './musicbill';

const reloadMusicbillList = () =>
  playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL_LIST, {
    silence: false,
  });
const Style = styled.div`
  padding: 10px 0 max(env(safe-area-inset-bottom, 0) + 10px) 0;
`;
const StatusContainer = styled.div`
  ${flexCenter}
  padding: 30px 0;
`;

function MusicbillList({ music }: { music: MusicWithSingerAliases }) {
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
        <Empty description={t('empty_musicbill_warning')} />
      </StatusContainer>
    );
  }
  if (getMusicbillListStatus === RequestStatus.ERROR) {
    return (
      <StatusContainer>
        <ErrorCard
          errorMessage={t('failed_to_get_musicbill_list')}
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
