import { memo, useState, ChangeEvent, KeyboardEvent, FocusEvent } from 'react';
import styled from 'styled-components';
import IconButton, { Name } from '@/components/icon_button';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import notice from '#/utils/notice';
import Input from '@/components/input';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/music';
import useNavigate from '#/utils/use_navigate';
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

  const [keyword, setKeyword] = useState('');
  const onKeywordChange = (event: ChangeEvent<HTMLInputElement>) =>
    setKeyword(event.target.value);

  const onSearch = () => {
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
      <Input
        type="text"
        className="keyword"
        value={keyword}
        onChange={onKeywordChange}
        placeholder="搜索"
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        ref={inputRef}
        maxLength={SEARCH_KEYWORD_MAX_LENGTH}
      />
      <IconButton name={Name.SEARCH_OUTLINE} onClick={onSearch} />
    </Style>
  );
}

export default memo(Wrapper);
