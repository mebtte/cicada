import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import { flexCenter } from '@/style/flexbox';
import Spinner from '@/components/spinner';
import Button from '@/components/button';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import { QueueMusic } from '../../constants';
import { Status } from './constants';
import useLyricData from './use_lyric_data';
import Lyric from './lyric';

const Container = styled(animated.div)`
  z-index: 1;

  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: calc(184px + env(safe-area-inset-bottom, 0px));
`;
const LoadingContainer = styled(Container)`
  ${flexCenter}
`;
const ErrorContainer = styled(Container)`
  ${flexCenter}
  flex-direction: column;
  gap: 20px;
  padding: 0 40px;

  > .message {
    display: inline-grid;

    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: 18px;
    font-weight: 900;
    line-height: 1.5;
    letter-spacing: 0;
    text-align: center;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};

    > span {
      grid-area: 1 / 1;

      ${upperCaseFirstLetter}
    }

    > .outline {
      color: transparent;
      pointer-events: none;
      -webkit-text-stroke: 3px rgb(255 255 255 / 0.96);
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
            <div className="message">
              <span className="outline" aria-hidden>
                {d.error.message}
              </span>
              <span>{d.error.message}</span>
            </div>
            <Button variant="primary" onClick={retry}>
              {t('retry')}
            </Button>
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
