import Empty from '@/components/empty';
import { CSSProperties } from 'react';
import styled from 'styled-components';
import Music from '../components/music';
import { MusicWithIndex } from '../constants';

const Root = styled.div`
  min-height: 100vh;
`;
const style: CSSProperties = {
  padding: '50px 0',
};

function MusicList({ musicList }: { musicList: MusicWithIndex[] }) {
  if (musicList.length) {
    return (
      <Root>
        {musicList.map((music) => (
          <Music key={music.id} music={music} miniMode />
        ))}
      </Root>
    );
  }
  return <Empty description="暂未创建音乐" style={style} />;
}

export default MusicList;
