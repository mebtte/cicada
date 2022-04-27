import React, { ReactNode, useContext } from 'react';
import styled from 'styled-components';
import { useTransition, animated } from 'react-spring';

import { CONTROLLER_HEIGHT, Music } from '../constants';
import PlayerContext from '../context';
import LrcDisplay from './lrc_display';
import TurnTable from './turntable';
import useMusicLrc from './use_music_lrc';
import { Status } from './constants';

const Container = styled(animated.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100% - ${CONTROLLER_HEIGHT}px);
`;
const Text = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  background: #fff;
  color: var(--text-color-primary);
  border-radius: 4px;
  padding: 5px 15px;
  font-size: 12px;
  white-space: nowrap;
  > .retry {
    cursor: pointer;
    text-decoration: underline;
  }
`;

const Content = ({
  turntable,
  toggleTurntable,
  music,
}: {
  turntable: boolean;
  toggleTurntable: () => void;
  music: Music;
}) => {
  const { audioPaused } = useContext(PlayerContext);
  const state = useMusicLrc(music, turntable);

  const transitions = useTransition(state, {
    from: {
      opacity: 0,
    },
    enter: {
      opacity: 1,
    },
    leave: {
      opacity: 0,
    },
  });
  return transitions((style, s) => {
    let content: ReactNode = null;
    if (s.status === Status.TURNTABLE) {
      content = (
        <TurnTable
          paused={audioPaused}
          cover={music.cover}
          toggleTurntable={toggleTurntable}
        />
      );
    } else if (s.status === Status.LRC_SUCCESS) {
      content = <LrcDisplay lrc={s.lrc} />;
    } else if (s.status === Status.LRC_EMPTY) {
      content = <Text onClick={toggleTurntable}>暂未收录歌词</Text>;
    } else if (s.status === Status.LRC_ERROR) {
      content = (
        <Text>
          获取歌词失败,&nbsp;
          <span className="retry" onClick={s.retry}>
            重新获取
          </span>
        </Text>
      );
    }
    return <Container style={style}>{content}</Container>;
  });
};

export default Content;
