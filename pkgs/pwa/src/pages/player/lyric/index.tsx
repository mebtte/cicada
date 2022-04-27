import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { useTransition, animated } from 'react-spring';

import useOpen from './use_open';
import { Music } from '../constants';
import Action from './action';
import Background from './background';
import Content from './content';

const Style = styled(animated.div)`
  z-index: 2;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const Lyric = ({
  music,
  onClose,
  style,
  turntable,
  toggleTurntable,
}: {
  music: Music;
  onClose: () => void;
  style: unknown;
  turntable: boolean;
  toggleTurntable: () => void;
}) => (
  <Style style={style}>
    <Background cover={music.cover} />
    <Content
      music={music}
      turntable={turntable}
      toggleTurntable={toggleTurntable}
    />
    <Action
      music={music}
      onClose={onClose}
      turntable={turntable}
      toggleTurntable={toggleTurntable}
    />
  </Style>
);

const Wrapper = ({ music }: { music: Music }) => {
  const { open, onClose } = useOpen();

  const [turntable, setTurntable] = useState(false);
  const toggleTurntable = useCallback(() => setTurntable((t) => !t), []);

  const openComposite = music && open;
  const transitions = useTransition(openComposite, {
    from: { transform: 'translateY(100%)', opacity: 0 },
    enter: { transform: 'translateY(0%)', opacity: 1 },
    leave: { transform: 'translateY(100%)', opacity: 0 },
  });
  return transitions((style, o) =>
    o ? (
      <Lyric
        music={music}
        onClose={onClose}
        style={style}
        turntable={turntable}
        toggleTurntable={toggleTurntable}
      />
    ) : null,
  );
};

export default React.memo(Wrapper);
