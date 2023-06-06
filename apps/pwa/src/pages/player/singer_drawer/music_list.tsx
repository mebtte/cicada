import { CSSProperties, memo, useContext } from 'react';
import Empty from '@/components/empty';
import { MusicWithSingerAliases, Index } from '../constants';
import Music from '../components/music';
import Context from '../context';

const emptyStyle: CSSProperties = {
  padding: '50px 0',
};

function MusicList({
  musicList,
}: {
  musicList: (MusicWithSingerAliases & Index)[];
}) {
  const { playqueue, currentPlayqueuePosition } = useContext(Context);
  return musicList.length ? (
    <div>
      {musicList.map((music) => (
        <Music
          key={music.id}
          music={music}
          active={playqueue[currentPlayqueuePosition]?.id === music.id}
        />
      ))}
    </div>
  ) : (
    <Empty description="暂未收录音乐" style={emptyStyle} />
  );
}

export default memo(MusicList);
