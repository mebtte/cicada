import Empty from '@/components/empty';
import { CSSProperties } from 'react';
import List from 'react-list';
import Music from '../components/music';
import { MusicWithIndex } from '../constants';

const style: CSSProperties = {
  padding: '50px 0',
};

function MusicList({ musicList }: { musicList: MusicWithIndex[] }) {
  return musicList.length ? (
    <List
      length={musicList.length}
      type="uniform"
      // eslint-disable-next-line react/no-unstable-nested-components
      itemRenderer={(index, key) => (
        <Music key={key} music={musicList[index]} miniMode />
      )}
    />
  ) : (
    <Empty description="暂无音乐" style={style} />
  );
}

export default MusicList;
