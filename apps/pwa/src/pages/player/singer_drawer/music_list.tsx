import { CSSProperties, memo, useContext } from 'react';
import Empty from '@/components/empty';
import { MusicWithSingerAliases } from '../constants';
import Music from '../components/music';
import Context from '../context';

const rootStyle: CSSProperties = {
  marginTop: 5,
};
const emptyStyle: CSSProperties = {
  padding: '50px 0',
};

function MusicList({ musicList }: { musicList: MusicWithSingerAliases[] }) {
  const { playqueue, currentPlayqueuePosition } = useContext(Context);
  return musicList.length ? (
    <div style={rootStyle}>
      {musicList.map((music, index) => (
        <Music
          key={music.id}
          index={musicList.length - index}
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
