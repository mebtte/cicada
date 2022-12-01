import Empty from '@/components/empty';
import { CSSProperties, useContext } from 'react';
import List from 'react-list';
import mm from '@/global_states/mini_mode';
import Music from '../components/music';
import { MusicWithIndex } from '../constants';
import Context from '../context';

const emptyStyle: CSSProperties = {
  padding: '50px 0',
};

function MusicList({ musicList }: { musicList: MusicWithIndex[] }) {
  const miniMode = mm.useState();
  const { playqueue, currentPlayqueuePosition } = useContext(Context);
  return musicList.length ? (
    <List
      length={musicList.length}
      type="uniform"
      // eslint-disable-next-line react/no-unstable-nested-components
      itemRenderer={(index, key) => {
        const music = musicList[index];
        return (
          <Music
            key={key}
            music={music}
            active={playqueue[currentPlayqueuePosition]?.id === music.id}
            miniMode={miniMode}
          />
        );
      }}
    />
  ) : (
    <Empty description="暂无音乐" style={emptyStyle} />
  );
}

export default MusicList;
