import Empty from '@/components/empty';
import { CSSProperties, useContext } from 'react';
import List from 'react-list';
import Music from '../components/music';
import { MusicWithIndex } from '../constants';
import Context from '../context';

const style: CSSProperties = {
  padding: '50px 0',
};

function MusicList({ musicList }: { musicList: MusicWithIndex[] }) {
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
          />
        );
      }}
    />
  ) : (
    <Empty description="暂无音乐" style={style} />
  );
}

export default MusicList;
