import Spinner from '#/components/spinner';
import { useContext } from 'react';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import { RequestStatus } from '@/constants';
import { animated, useTransition } from 'react-spring';
import Button, { Variant } from '#/components/button';
import Context from '../../context';
import e, { EventType } from '../../eventemitter';
import Musicbill from './musicbill';
import { openCreateMusicbillDialog } from '../../utils';

const reloadMusicbillList = () => e.emit(EventType.RELOAD_MUSICBILL_LIST, null);
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
  padding-bottom: calc(env(safe-area-inset-bottom, 0) + 10px);
`;
const StatusBox = styled(TransitionBox)`
  padding: 5px 20px;
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
            <StatusBox style={style}>
              <Button
                variant={Variant.PRIMARY}
                onClick={openCreateMusicbillDialog}
              >
                创建乐单
              </Button>
            </StatusBox>
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
                errorMessage="获取乐单列表失败"
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
