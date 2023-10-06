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
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
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
  ${autoScrollbar}

  > .description {
    margin: 10px 20px;

    font-size: 12px;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};

    display: flex;
    align-items: center;
    gap: 5px;

    > span {
      ${upperCaseFirstLetter}
    }
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
                  {t(
                    'invitation_will_be_canceled_automatically_after_days',
                    `${TTL_DAY}-${TTL_DAY + 1}`,
                  )}
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
            <Empty description={t('no_shared_musicbill_invitation')} />
          </CenteredContainer>
        );
      })}
    </Root>
  );
}

export default SharedMusicbillInvitation;
