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
      {musicList.map((music, index) => (
        <Music
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          musicWithIndex={music}
        />
      ))}
    </div>
  ) : (
    <Empty description="当前歌手没有收录音乐" style={emptyStyle} />
  );
}

export default memo(MusicList);
