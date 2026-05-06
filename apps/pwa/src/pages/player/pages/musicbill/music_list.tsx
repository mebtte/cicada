import Spinner from '@/components/spinner';
import { flexCenter } from '@/style/flexbox';
import { RequestStatus } from '@/constants';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import List from 'react-list';
import Empty from '@/components/empty';
import { useContext } from 'react';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import { CSS_VAR } from '@/components/theme';
import { FLOATING_CONTROLLER_SCROLL_SPACE, Musicbill } from '../../constants';
import { INFO_HEIGHT } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import Music from '../../components/music';
import Context from '../../context';

const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;
const Style = styled.div`
  position: relative;
  width: 100%;
  min-height: calc(100% - ${INFO_HEIGHT}px - 18px);
`;
const Container = styled(animated.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
`;
const StatusContainer = styled(Container)`
  height: 100%;

  ${flexCenter}
`;
const DuoMusic = styled(Music)`
  && {
    min-height: 72px;
    margin-bottom: 10px;
    padding: 0 14px 4px;
    gap: 14px;

    position: relative;
    overflow: hidden;

    background: ${({ active }) =>
      active ? 'rgb(232 255 218)' : '#fff'} !important;
    border: 2px solid ${({ active }) => (active ? PRIMARY : CSSVariable.COLOR_BORDER)};
    border-radius: 16px;
    box-shadow: 0 4px 0 ${({ active }) =>
      active ? PRIMARY_SHADOW : 'rgb(232 232 232)'};

    transition:
      transform 150ms ease-out,
      box-shadow 150ms ease-out,
      border-color 150ms ease-out,
      filter 120ms ease-out;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 8px;
      height: 100%;
      background: ${({ active }) =>
        active ? PRIMARY : 'rgb(255 184 28)'};
    }

    > .index {
      width: auto;
      height: auto;
      background: transparent;
      border: 0;
      border-radius: 0;
      color: ${({ active }) =>
        active ? PRIMARY : CSSVariable.TEXT_COLOR_SECONDARY};
      font-family: monospace;
      font-size: ${CSSVariable.TEXT_SIZE_SMALL};
      font-weight: 900;
      writing-mode: vertical-lr;
    }

    > .content {
      min-width: 0;

      > .music {
        min-height: 68px;
        gap: 14px;

        > .info {
          > .top {
            > .name {
              color: ${({ active }) =>
                active ? 'rgb(58 122 0)' : CSSVariable.TEXT_COLOR_PRIMARY};
              font-weight: 900;
            }

            > .alias {
              font-weight: 700;
            }
          }

          > .singers {
            font-weight: 700;
          }
        }

        > div:last-child {
          flex: 0 0 auto;
          gap: 8px;

          > button {
            color: ${CSSVariable.TEXT_COLOR_PRIMARY};
            background: #fff;
            border-color: rgb(210 210 210);
            border-radius: 10px;
            box-shadow: 0 3px 0 rgb(185 185 185);
            transition:
              transform 150ms ease-out,
              box-shadow 150ms ease-out,
              filter 120ms ease-out;

            &:first-child {
              color: #fff;
              background: ${PRIMARY};
              border-color: ${PRIMARY_SHADOW};
              box-shadow: 0 3px 0 ${PRIMARY_SHADOW};
            }

            &:not(:disabled):hover {
              filter: brightness(1.05);
            }

            &:not(:disabled):active {
              transform: translateY(3px);
              box-shadow: none;
              transition:
                transform 60ms ease-in,
                box-shadow 60ms ease-in,
                filter 60ms ease-in;
            }
          }
        }
      }
    }

    &:hover {
      border-color: ${({ active }) => (active ? PRIMARY : 'rgb(198 198 198)')};
      filter: brightness(1.02);
    }

    &:active {
      transform: translateY(4px);
      box-shadow: none;
      transition:
        transform 60ms ease-in,
        box-shadow 60ms ease-in,
        filter 60ms ease-in;
    }
  }
`;
const ListContainer = styled(Container)`
  &::after {
    content: '';
    display: block;
    height: ${FLOATING_CONTROLLER_SCROLL_SPACE};
  }
`;

function Wrapper({ musicbill }: { musicbill: Musicbill }) {
  const { playqueue, currentPlayqueuePosition } = useContext(Context);

  const transitions = useTransition(musicbill, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Style>
      {transitions((style, mb) => {
        if (mb.status === RequestStatus.ERROR) {
          return (
            <StatusContainer style={style}>
              <ErrorCard
                errorMessage={mb.error!.message}
                retry={() =>
                  playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL, {
                    id: mb.id,
                    silence: false,
                  })
                }
              />
            </StatusContainer>
          );
        }

        if (mb.status === RequestStatus.SUCCESS) {
          if (mb.musicList.length) {
            return (
              <ListContainer style={style}>
                <List
                  type="uniform"
                  length={mb.musicList.length}
                  itemRenderer={(index, key) => {
                    const music = mb.musicList[index];
                    const active =
                      playqueue[currentPlayqueuePosition]?.id === music.id;
                    return (
                      <DuoMusic
                        key={key}
                        index={music.index}
                        music={music}
                        active={active}
                      />
                    );
                  }}
                />
              </ListContainer>
            );
          }
          return (
            <StatusContainer style={style}>
              <Empty description={t('empty_musicbill_warning')} />
            </StatusContainer>
          );
        }

        return (
          <StatusContainer style={style}>
            <Spinner />
          </StatusContainer>
        );
      })}
    </Style>
  );
}

export default Wrapper;
