import {
  memo,
  useState,
  ChangeEvent,
  KeyboardEvent,
  FocusEvent,
  CSSProperties,
  useRef,
  useEffect,
} from 'react';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
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

  const ref = useRef<{ root: HTMLDivElement; input: HTMLInputElement }>(null);

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

  useEffect(() => {
    const unlistenFocus = eventemitter.listen(
      EventType.FOCUS_SEARCH_INPUT,
      () => ref.current?.input.focus(),
    );
    return unlistenFocus;
  }, []);

  return (
    <Input
      ref={ref}
      style={style}
      inputProps={{
        type: 'search',
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
