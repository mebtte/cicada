import Empty from '@/components/empty';
import { CSSProperties, useContext } from 'react';
import styled from 'styled-components';
import Music from '../components/music';
import { MusicWithIndex } from '../constants';
import Context from '../context';

const Root = styled.div`
  min-height: 100vh;
`;
const style: CSSProperties = {
  padding: '50px 0',
};

function MusicList({ musicList }: { musicList: MusicWithIndex[] }) {
  const { playqueue, currentPlayqueuePosition } = useContext(Context);

  if (musicList.length) {
    return (
      <Root>
        {musicList.map((music) => (
          <Music
            key={music.id}
            music={music}
            active={playqueue[currentPlayqueuePosition]?.id === music.id}
            miniMode
          />
        ))}
      </Root>
    );
  }
  return <Empty description="暂未创建音乐" style={style} />;
}

export default MusicList;
