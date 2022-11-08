import { CSSProperties, memo } from 'react';
import Empty from '@/components/empty';
import { MusicWithIndex } from '../constants';
import Music from '../components/music';

const emptyStyle: CSSProperties = {
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
    <Empty description="当前歌手没有收录音乐" style={emptyStyle} />
  );
}

export default memo(MusicList);
