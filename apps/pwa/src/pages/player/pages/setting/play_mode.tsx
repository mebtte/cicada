import Tag from '#/components/tag';
import { PlayMode as PlayModeType } from '@/constants';
import { useContext } from 'react';
import styled from 'styled-components';
import { PLAY_MODE_MAP } from '../../constants';
import eventemitter, { EventType } from '../../eventemitter';
import Item from './item';
import Context from '../../context';
import { itemStyle } from './constants';

const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  > .item {
    cursor: pointer;
  }
`;
const changePlayMode = (playMode: PlayModeType) =>
  eventemitter.emit(EventType.CHANGE_PLAY_MODE, { playMode });

function PlayMode() {
  const { playMode } = useContext(Context);
  return (
    <Item label="播放模式" style={itemStyle}>
      <Style>
        {Object.values(PlayModeType).map((pm) => {
          const { label, tagComponentType } = PLAY_MODE_MAP[pm];
          const active = playMode === pm;
          return (
            <Tag
              key={pm}
              title={label}
              type={tagComponentType}
              gray={!active}
              onClick={() => changePlayMode(pm)}
              className="item"
            />
          );
        })}
      </Style>
    </Item>
  );
}

export default PlayMode;
