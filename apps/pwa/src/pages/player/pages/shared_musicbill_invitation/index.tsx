import styled from 'styled-components';
import { animated, useTransition } from 'react-spring';
import absoluteFullSize from '@/style/absolute_full_size';
import { flexCenter } from '@/style/flexbox';
import Spinner from '@/components/spinner';
import Empty from '@/components/empty';
import ErrorCard from '@/components/error_card';
import { SHARED_MUSICBILL_INVITATION_MINIMAL_TTL } from '#/constants';
import { CSSVariable } from '@/global_style';
import { MdHelpOutline } from 'react-icons/md';
import useData from './use_data';
import { HEADER_HEIGHT } from '../../constants';
import Page from '../page';
import Invitation from './invitation';

const TTL_DAY = SHARED_MUSICBILL_INVITATION_MINIMAL_TTL / (1000 * 60 * 60 * 24);
const Root = styled(Page)`
  position: relative;
`;
const Container = styled(animated.div)`
  ${absoluteFullSize}

  padding-top: ${HEADER_HEIGHT}px;
`;
const CenteredContainer = styled(Container)`
  ${flexCenter}
`;
const Content = styled(Container)`
  overflow: auto;

  > .description {
    margin: 10px 20px;

    font-size: 12px;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};

    display: flex;
    align-items: center;
    gap: 5px;
  }
`;

function SharedMusicbillInvitation() {
  const { data, reload } = useData();
  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Root>
      {transitions((style, d) => {
        if (d.loading) {
          return (
            <CenteredContainer style={style}>
              <Spinner />
            </CenteredContainer>
          );
        }
        if (d.error) {
          return (
            <CenteredContainer style={style}>
              <ErrorCard errorMessage={d.error.message} retry={reload} />
            </CenteredContainer>
          );
        }
        if (d.value.length) {
          return (
            <Content style={style}>
              <div className="description">
                <MdHelpOutline />
                <span>
                  邀请将保留 {TTL_DAY}-{TTL_DAY + 1} 天后自动拒绝
                </span>
              </div>
              <div className="list">
                {d.value.map((invitation) => (
                  <Invitation key={invitation.id} invitation={invitation} />
                ))}
              </div>
            </Content>
          );
        }
        return (
          <CenteredContainer style={style}>
            <Empty description="暂无共享乐单邀请" />
          </CenteredContainer>
        );
      })}
    </Root>
  );
}

export default SharedMusicbillInvitation;
