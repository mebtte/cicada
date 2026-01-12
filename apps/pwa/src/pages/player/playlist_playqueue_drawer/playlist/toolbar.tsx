import Label from '@/components/label';
import Input from '@/components/input';
import { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import IconButton from '@/components/icon_button';
import { MdPlaylistRemove } from 'react-icons/md';
import dialog from '@/utils/dialog';
import { t } from '@/i18n';
import { FILTER_HEIGHT } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import capitalize from '#/utils/capitalize';
import context from '../../context';

const Style = styled.div`
  position: absolute;
  width: 100%;
  height: calc(env(safe-area-inset-bottom, 0) + ${FILTER_HEIGHT}px);
  left: 0;
  bottom: 0;

  display: flex;
  align-items: center;
  gap: 10px;

  padding: 0 20px env(safe-area-inset-bottom, 0) 20px;

  backdrop-filter: blur(5px);

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
      <IconButton
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
      </IconButton>
      <Label className="filter">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={capitalize(t('search'))}
        />
      </Label>
    </Style>
  );
}

export default Toolbar;
