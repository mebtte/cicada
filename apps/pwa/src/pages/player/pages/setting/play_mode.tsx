import Tooltip from '#/components/tooltip';
import Tag from '#/components/tag';
import { PlayMode as PlayModeType } from '@/constants';
import { PLAY_MODE_MAP } from '../../constants';
import eventemitter, { EventType } from '../../eventemitter';
import Item from './item';

const tagStyle = {
  marginLeft: 10,
  cursor: 'pointer',
};
const changePlayMode = (playMode: PlayModeType) =>
  eventemitter.emit(EventType.CHANGE_PLAY_MODE, { playMode });

function PlayMode({ playMode }: { playMode: PlayModeType }) {
  return (
    <Item>
      <div className="label">播放模式</div>
      {Object.values(PlayModeType).map((pm) => {
        const { label, tagType } = PLAY_MODE_MAP[pm];
        return (
          <Tooltip key={pm} title={label}>
            <Tag
              type={tagType}
              gray={playMode !== pm}
              style={tagStyle}
              onClick={() => changePlayMode(pm)}
            />
          </Tooltip>
        );
      })}
    </Item>
  );
}

export default PlayMode;
