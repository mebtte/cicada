import Empty from '@/components/empty';
import { CSSProperties } from 'react';
import Music from '../components/music';
import { MusicWithIndex } from '../constants';

const style: CSSProperties = {
  padding: '50px 0',
};

function MusicList({ musicList }: { musicList: MusicWithIndex[] }) {
  return musicList.length ? (
    <div>
      {musicList.map((music) => (
        <Music key={music.id} music={music} miniMode />
      ))}
    </div>
  ) : (
    <Empty description="暂无音乐" style={style} />
  );
}

export default MusicList;
