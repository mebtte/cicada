import React from 'react';
import styled from 'styled-components';

import { MusicType } from '@/constants/music';
import IconButton, { Name } from '@/components/icon_button';
import { Music } from '../constants';
import eventemitter, { EventType } from './eventemitter';

const ACTION_SIZE = 24;
const Style = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 4px;
  background: rgb(255 255 255 / 0.7);
  transition: 300ms;
  &:hover {
    background: rgb(255 255 255 / 1);
  }
  > .action {
    cursor: pointer;
    -webkit-app-region: no-drag;
  }
`;
const scrollToCurrentLine = () =>
  eventemitter.emit(EventType.SCROLL_TO_CURRENT_LINE);

const Action = ({
  music,
  turntable,
  toggleTurntable,
  onClose,
}: {
  music: Music;
  turntable: boolean;
  toggleTurntable: () => void;
  onClose: () => void;
}) => (
  <Style>
    <IconButton
      name={Name.AIM_OUTLINE}
      onClick={scrollToCurrentLine}
      size={ACTION_SIZE}
      className="action"
      disabled={turntable || music.type === MusicType.INSTRUMENT}
    />
    <IconButton
      name={Name.EXCHANGE_OUTLINE}
      onClick={toggleTurntable}
      size={ACTION_SIZE}
      className="action"
      disabled={music.type === MusicType.INSTRUMENT}
    />
    <IconButton
      name={Name.DOWN_OUTLINE}
      onClick={onClose}
      size={ACTION_SIZE}
      className="action"
    />
  </Style>
);

export default Action;
