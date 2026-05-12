import Empty from '@/components/empty';
import { CSSProperties, useContext } from 'react';
import List from 'react-list';
import styled from 'styled-components';
import { t } from '@/i18n';
import Music from '../components/music';
import { MusicWithSingerAliases } from '../constants';
import Context from '../context';

const emptyStyle: CSSProperties = {
  padding: '50px 0',
};
const ListShell = styled.div`
  padding: 12px 12px 16px;
`;

function MusicList({ musicList }: { musicList: MusicWithSingerAliases[] }) {
  const { playqueue, currentPlayqueuePosition } = useContext(Context);
  return musicList.length ? (
    <ListShell>
      <List
        length={musicList.length}
        type="uniform"
        itemRenderer={(index, key) => {
          const music = musicList[index];
          return (
            <Music
              key={key}
              index={musicList.length - index}
              music={music}
              active={playqueue[currentPlayqueuePosition]?.id === music.id}
            />
          );
        }}
      />
    </ListShell>
  ) : (
    <Empty description={t('no_music')} style={emptyStyle} />
  );
}

export default MusicList;
