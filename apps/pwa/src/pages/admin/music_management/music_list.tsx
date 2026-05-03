import { ChangeEventHandler, useEffect, useState } from 'react';
import styled from 'styled-components';
import searchMusicRequest from '@/server/api/search_music';
import { CSSVariable } from '@/global_style';
import Input from '@/components/input';
import Spinner from '@/components/spinner';
import { t } from '@/i18n';
import { MdOutlineEdit, MdMusicNote } from 'react-icons/md';
import autoScrollbar from '@/style/auto_scrollbar';

interface MusicItem {
  id: string;
  name: string;
  singers: { id: string; name: string }[];
  cover: string;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const List = styled.div`
  overflow-y: auto;
  ${autoScrollbar}
  max-height: 380px;
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const MusicRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 6px;
  border-radius: 6px;
  transition: background 0.12s;
  cursor: default;

  &:hover {
    background: #f5f6f8;

    .edit-btn {
      opacity: 1;
    }
  }
`;

const Cover = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 6px;
  flex-shrink: 0;
  overflow: hidden;
  background: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${CSSVariable.TEXT_COLOR_DISABLED};
  font-size: 16px;

  > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;
`;

const MusicName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
`;

const SingerName = styled.div`
  font-size: 11px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 1px;
`;

const EditBtn = styled.button`
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.12s, background 0.12s, color 0.12s;

  &:hover {
    background: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
    color: ${CSSVariable.COLOR_PRIMARY};
  }
`;

const EmptyTip = styled.div`
  padding: 32px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: ${CSSVariable.TEXT_COLOR_DISABLED};
  font-size: 13px;

  > svg {
    font-size: 32px;
  }
`;

const SpinnerBox = styled.div`
  padding: 32px 0;
  display: flex;
  justify-content: center;
`;

function MusicList({ onEdit }: { onEdit: (id: string) => void }) {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [musicList, setMusicList] = useState<MusicItem[]>([]);

  const onKeywordChange: ChangeEventHandler<HTMLInputElement> = (e) =>
    setKeyword(e.target.value);

  useEffect(() => {
    const trimmed = keyword.trim();
    setLoading(true);
    const controller = new AbortController();
    searchMusicRequest({ keyword: trimmed, page: 1, pageSize: 30 })
      .then((data) => {
        if (!controller.signal.aborted) setMusicList(data.musicList);
      })
      .catch(() => {
        if (!controller.signal.aborted) setMusicList([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [keyword]);

  return (
    <Container>
      <Input
        value={keyword}
        onChange={onKeywordChange}
        placeholder={t('search')}
      />
      {loading ? (
        <SpinnerBox>
          <Spinner />
        </SpinnerBox>
      ) : musicList.length === 0 ? (
        <EmptyTip>
          <MdMusicNote />
          {t('no_suitable_music')}
        </EmptyTip>
      ) : (
        <List>
          {musicList.map((music) => (
            <MusicRow key={music.id}>
              <Cover>
                {music.cover ? (
                  <img src={music.cover} alt={music.name} />
                ) : (
                  <MdMusicNote />
                )}
              </Cover>
              <Info>
                <MusicName>{music.name}</MusicName>
                <SingerName>
                  {music.singers.map((s) => s.name).join(' · ') ||
                    t('unknown')}
                </SingerName>
              </Info>
              <EditBtn
                className="edit-btn"
                onClick={() => onEdit(music.id)}
                title={t('edit_name')}
              >
                <MdOutlineEdit size={15} />
              </EditBtn>
            </MusicRow>
          ))}
        </List>
      )}
    </Container>
  );
}

export default MusicList;
