import {
  memo,
  useState,
  ChangeEvent,
  KeyboardEvent,
  CSSProperties,
  useRef,
  useEffect,
} from 'react';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import useNavigate from '#/utils/use_navigate';
import Input from '#/components/input';
import mm from '@/global_states/mini_mode';
import { Query } from '@/constants';
import { useLocation } from 'react-router-dom';
import parseSearch from '@/utils/parse_search';
import eventemitter, { EventType } from '../eventemitter';

const style: CSSProperties = {
  // @ts-expect-error
  WebkitAppRegion: 'no-drag',
  width: 180,
};

function Wrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const miniMode = mm.useState();

  const ref = useRef<{ root: HTMLDivElement; input: HTMLInputElement }>(null);

  const [keyword, setKeyword] = useState(
    () => parseSearch<Query.KEYWORD>(location.search)[Query.KEYWORD] || '',
  );
  const onKeywordChange = (event: ChangeEvent<HTMLInputElement>) =>
    setKeyword(event.target.value);

  const onSearch = () => {
    if (miniMode) {
      return navigate({
        path: ROOT_PATH.PLAYER + PLAYER_PATH.SEARCH,
      });
    }

    return navigate({
      path: ROOT_PATH.PLAYER + PLAYER_PATH.SEARCH,
      query: {
        [Query.KEYWORD]: window.encodeURIComponent(
          keyword.replace(/\s+/g, ' ').trim(),
        ),
        [Query.PAGE]: 1,
      },
    });
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch();
    }
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
      }}
    />
  );
}

export default memo(Wrapper);
