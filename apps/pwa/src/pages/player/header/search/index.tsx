import { memo, useState, ChangeEvent, KeyboardEvent, FocusEvent } from 'react';
import styled from 'styled-components';
import { MdSearch } from 'react-icons/md';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import notice from '#/utils/notice';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/music';
import useNavigate from '#/utils/use_navigate';
import Input from '#/components/input';
import IconButton from '#/components/icon_button';
import mm from '@/global_states/mini_mode';
import useKeyboard from './use_keyboard';
import { Query } from '../../pages/search/constants';
import eventemitter, { EventType } from '../../eventemitter';

const Style = styled.div`
  -webkit-app-region: no-drag;
  display: flex;
  align-items: center;
  gap: 5px;
  > .keyword {
    width: 180px;
    margin-left: 5px;
  }
`;

function Wrapper() {
  const navigate = useNavigate();
  const miniMode = mm.useState();

  const [keyword, setKeyword] = useState('');
  const onKeywordChange = (event: ChangeEvent<HTMLInputElement>) =>
    setKeyword(event.target.value);

  const onSearch = () => {
    if (miniMode) {
      return navigate({
        path: ROOT_PATH.PLAYER + PLAYER_PATH.SEARCH,
      });
    }
    const trimKeyword = keyword.trim();
    if (!trimKeyword) {
      return notice.error('请输入关键字');
    }
    return navigate({
      path: ROOT_PATH.PLAYER + PLAYER_PATH.SEARCH,
      query: {
        [Query.SEARCH_VALUE]: trimKeyword,
        [Query.PAGE]: 1,
      },
    });
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch();
    }
  };
  const onFocus = (event: FocusEvent<HTMLInputElement>) => {
    eventemitter.emit(EventType.CLOSE_LYRIC, null);
    return event.target.select();
  };
  const inputRef = useKeyboard();

  return (
    <Style>
      {miniMode ? null : (
        <Input
          className="keyword"
          inputProps={{
            value: keyword,
            onChange: onKeywordChange,
            onKeyDown,
            placeholder: '搜索',
            maxLength: SEARCH_KEYWORD_MAX_LENGTH,
            onFocus,
          }}
          ref={inputRef}
        />
      )}
      <IconButton onClick={onSearch}>
        <MdSearch />
      </IconButton>
    </Style>
  );
}

export default memo(Wrapper);
