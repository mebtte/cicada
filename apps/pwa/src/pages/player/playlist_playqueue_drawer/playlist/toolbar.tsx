import Input from '@/components/input';
import { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import Button from '@/components/button';
import { MdPlaylistRemove } from 'react-icons/md';
import dialog from '@/utils/dialog';
import { t } from '@/i18n';
import { FILTER_HEIGHT } from './constants';
import { TAB_LIST_HEIGHT } from '../constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import capitalize from '@/utils/capitalize';
import context from '../../context';

const Style = styled.div`
  position: absolute;
  width: 100%;
  height: ${FILTER_HEIGHT}px;
  left: 0;
  bottom: calc(${TAB_LIST_HEIGHT}px + env(safe-area-inset-bottom, 0));

  display: flex;
  align-items: center;
  gap: 10px;

  padding: 6px 16px 10px;

  background: rgb(255 255 255 / 0.94);
  border-top: 2px solid rgb(232 232 232);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  > .filter {
    flex: 1;
    min-width: 0;
  }
`;

function Toolbar({
  onKeywordChange,
}: {
  onKeywordChange: (keyword: string) => void;
}) {
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => onKeywordChange(keyword), 500);
    return () => window.clearTimeout(timer);
  }, [keyword, onKeywordChange]);

  const { playlist } = useContext(context);
  return (
    <Style>
      <Button
        square
        variant="danger"
        size="sm"
        disabled={playlist.length === 0}
        onClick={() =>
          dialog.confirm({
            title: t('clear_playlist_question'),
            onConfirm: () =>
              void playerEventemitter.emit(
                PlayerEventType.ACTION_CLEAR_PLAYLIST,
                null,
              ),
          })
        }
      >
        <MdPlaylistRemove />
      </Button>
      <Input
        className="filter"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder={capitalize(t('search'))}
      />
    </Style>
  );
}

export default Toolbar;
