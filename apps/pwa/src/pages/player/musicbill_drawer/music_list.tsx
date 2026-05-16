import Empty from '@/components/empty';
import { CSSProperties, RefObject, useContext } from 'react';
import styled from 'styled-components';
import { t } from '@/i18n';
import VirtualList from '@/components/virtual_list';
import Music from '../components/music';
import { MusicWithSingerAliases } from '../constants';
import Context from '../context';

const emptyStyle: CSSProperties = {
  padding: '50px 0',
};
const ListShell = styled.div`
  padding: 12px 12px 16px;
`;

function MusicList({
  musicList,
  scrollElementRef,
}: {
  musicList: MusicWithSingerAliases[];
  scrollElementRef?: RefObject<HTMLElement | null>;
}) {
  const { playqueue, currentPlayqueuePosition } = useContext(Context);
  return musicList.length ? (
    <ListShell>
      <VirtualList
        count={musicList.length}
        getItemKey={(index) => musicList[index].id}
        scrollElementRef={scrollElementRef}
        renderItem={(index, key) => {
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
