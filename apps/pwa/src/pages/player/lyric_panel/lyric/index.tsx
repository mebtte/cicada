import absoluteFullSize from '@/style/absolute_full_size';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import { flexCenter } from '@/style/flexbox';
import Spinner from '@/components/spinner';
import Button, { Variant } from '@/components/button';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import { QueueMusic } from '../../constants';
import { Status } from './constants';
import useLyricData from './use_lyric_data';
import Lyric from './lyric';

const Container = styled(animated.div)`
  z-index: 1;

  ${absoluteFullSize}
  height: calc(100% - 120px);
`;
const LoadingContainer = styled(Container)`
  ${flexCenter}
`;
const ErrorContainer = styled(Container)`
  ${flexCenter}

  >.content {
    backdrop-filter: blur(10px);
    background-color: rgb(255 255 255 / 0.8);
    border-radius: ${CSSVariable.BORDER_RADIUS_NORMAL};

    padding: 20px;
    margin: 0 20px;

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;

    > .message {
      font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
      text-align: center;

      ${upperCaseFirstLetter}
    }
  }
`;

function Wrapper({ queueMusic }: { queueMusic: QueueMusic }) {
  const { data, retry } = useLyricData(queueMusic);

  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });

  return transitions((style, d) => {
    switch (d.status) {
      case Status.SUCCESS: {
        return (
          <Container style={style}>
            <Lyric lrcs={d.lrcs} />
          </Container>
        );
      }

      case Status.LOADING: {
        return (
          <LoadingContainer style={style}>
            <Spinner />
          </LoadingContainer>
        );
      }

      case Status.ERROR: {
        return (
          <ErrorContainer style={style}>
            <div className="content">
              <div className="message">{d.error.message}</div>
              <Button variant={Variant.PRIMARY} onClick={retry}>
                {t('retry')}
              </Button>
            </div>
          </ErrorContainer>
        );
      }

      default: {
        return null;
      }
    }
  });
}

export default Wrapper;
