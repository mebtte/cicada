import Spinner from '@/components/spinner';
import Empty from '@/components/empty';
import { useContext } from 'react';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import { RequestStatus } from '@/constants';
import { animated, useTransition } from 'react-spring';
import Button from '@/components/button';
import { t } from '@/i18n';
import { MdOutlineAddBox } from 'react-icons/md';
import Context from '../../context';
import e, { EventType } from '../../eventemitter';
import { FLOATING_CONTROLLER_SCROLL_SPACE } from '../../constants';
import Musicbill from './musicbill';
import { openCreateMusicbillDialog } from '../../utils';

const reloadMusicbillList = () =>
  e.emit(EventType.RELOAD_MUSICBILL_LIST, { silence: false });
const Style = styled.div`
  position: relative;
`;
const TransitionBox = styled(animated.div)`
  position: absolute;
  width: 100%;
  top: 0;
  left: 0;
`;
const StyledMusicbillList = styled(TransitionBox)`
  padding-bottom: ${FLOATING_CONTROLLER_SCROLL_SPACE};

  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const StatusBox = styled(TransitionBox)`
  padding: 5px 12px;
`;
const EmptyBox = styled(TransitionBox)`
  padding: 18px 12px calc(${FLOATING_CONTROLLER_SCROLL_SPACE} + 18px);

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  > .empty {
    padding-top: 6px;
    padding-bottom: 2px;
  }
`;

function MusicbillList() {
  const { getMusicbillListStatus, musicbillList } = useContext(Context);

  const transitions = useTransition(getMusicbillListStatus, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });

  return (
    <Style>
      {transitions((style, status) => {
        if (status === RequestStatus.SUCCESS) {
          if (musicbillList.length) {
            return (
              <StyledMusicbillList style={style}>
                {musicbillList.map((m) => (
                  <Musicbill key={m.id} musicbill={m} />
                ))}
              </StyledMusicbillList>
            );
          }
          return (
            <EmptyBox style={style}>
              {/* 全新安装时乐单列表为空，在列表区域展示空状态并保留创建入口。 */}
              <Empty className="empty" description={t('no_musicbill')} />
              <Button
                block
                size="sm"
                variant="primary"
                icon={<MdOutlineAddBox />}
                onClick={openCreateMusicbillDialog}
              >
                {t('create_musicbill')}
              </Button>
            </EmptyBox>
          );
        }
        if (status === RequestStatus.LOADING) {
          return (
            <StatusBox style={style}>
              <Spinner />
            </StatusBox>
          );
        }
        if (status === RequestStatus.ERROR) {
          return (
            <StatusBox style={style}>
              <ErrorCard
                errorMessage={t('failed_to_get_musicbill_list')}
                retry={reloadMusicbillList}
              />
            </StatusBox>
          );
        }
        return null;
      })}
    </Style>
  );
}

export default MusicbillList;
