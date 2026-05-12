import { CSSProperties, memo, useContext } from 'react';
import Empty from '@/components/empty';
import styled from 'styled-components';
import { MusicWithSingerAliases } from '../constants';
import Music from '../components/music';
import Context from '../context';
import { t } from '@/i18n';

const Root = styled.div`
  padding: 12px 12px 16px;
`;
const emptyStyle: CSSProperties = {
  padding: '50px 0',
};

function MusicList({ musicList }: { musicList: MusicWithSingerAliases[] }) {
  const { playqueue, currentPlayqueuePosition } = useContext(Context);
  return musicList.length ? (
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
  ) : (
    <Empty description={t('no_music_singer_warning')} style={emptyStyle} />
  );
}

export default memo(MusicList);
