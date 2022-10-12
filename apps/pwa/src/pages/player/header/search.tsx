import {
  memo,
  useState,
  ChangeEvent,
  KeyboardEvent,
  FocusEvent,
  CSSProperties,
} from 'react';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import notice from '#/utils/notice';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/music';
import useNavigate from '#/utils/use_navigate';
import Input from '#/components/input';
import mm from '@/global_states/mini_mode';
import { Query } from '@/constants';
import eventemitter, { EventType } from '../eventemitter';

const style: CSSProperties = {
  // @ts-expect-error
  WebkitAppRegion: 'no-drag',
  width: 180,
};

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

  return (
    <Input
      style={style}
      inputProps={{
        value: keyword,
        onChange: onKeywordChange,
        onKeyDown,
        placeholder: '搜索',
        maxLength: SEARCH_KEYWORD_MAX_LENGTH,
        onFocus,
      }}
    />
  );
}

export default memo(Wrapper);
