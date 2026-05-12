import Empty from '@/components/empty';
import { CSSProperties, useContext } from 'react';
import styled from 'styled-components';
import Music from '../components/music';
import { MusicWithSingerAliases } from '../constants';
import Context from '../context';
import { t } from '@/i18n';

const Root = styled.div`
  min-height: 100dvb;
  padding: 12px 12px 16px;
`;
const style: CSSProperties = {
  padding: '50px 0',
};

function MusicList({ musicList }: { musicList: MusicWithSingerAliases[] }) {
  const { playqueue, currentPlayqueuePosition } = useContext(Context);

  if (musicList.length) {
    return (
      <Root>
        {musicList.map((music, index) => (
          <Music
            key={music.id}
            index={musicList.length - index}
            music={music}
            active={playqueue[currentPlayqueuePosition]?.id === music.id}
          />
        ))}
      </Root>
    );
  }
  return <Empty description={t('no_created_music')} style={style} />;
}

export default MusicList;
