import Input from '@/components/input';
import { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import Button from '@/components/button';
import { MdPlaylistRemove } from 'react-icons/md';
import dialog from '@/utils/dialog';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import { FILTER_HEIGHT } from './constants';
import { TAB_LIST_HEIGHT } from '../constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import capitalize from '@/utils/capitalize';
import context from '../../context';

const Style = styled.div`
  position: absolute;
  left: 32px;
  right: 32px;
  height: ${FILTER_HEIGHT}px;
  bottom: calc(${TAB_LIST_HEIGHT}px + env(safe-area-inset-bottom, 0));
  z-index: 2;

  display: flex;
  align-items: center;
  gap: 10px;

  padding: 8px 10px 12px;

  background: rgb(255 255 255 / 0.94);
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 16px;
  box-shadow: 0 4px 0 ${CSSVariable.COLOR_SURFACE_SHADOW};
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
            confirmVariant: 'danger',
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
