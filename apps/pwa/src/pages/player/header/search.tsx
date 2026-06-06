import {
  memo,
  useState,
  ChangeEvent,
  useRef,
  useEffect,
  FormEvent,
} from 'react';
import styled from 'styled-components';
import { Search } from '@/components/icon';
import { ROOT_PATH } from '@/constants/route';
import useNavigate from '@/utils/use_navigate';
import Input from '@/components/input';
import Button from '@/components/button';
import { Query } from '@/constants';
import { useLocation } from 'react-router-dom';
import parseSearch from '@/utils/parse_search';
import { t } from '@/i18n';
import capitalize from '@/utils/capitalize';
import eventemitter, { EventType } from '../eventemitter';
import { useTheme } from '@/global_states/theme';
import { isComposingEnterKeyDown } from '@/utils/keyboard';

const SearchForm = styled.form`
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  width: 240px;
  -webkit-app-region: no-drag;

  > .input {
    flex: 1;
    min-width: 0;

    > div {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      border-right-width: 0;
    }
  }

  > button {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  @media (min-width: 1024px) {
    width: 320px;
  }

  @media (min-width: 1440px) {
    width: 420px;
  }
`;

function Wrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const { miniMode } = useTheme();
  const searchLabel = capitalize(t('search'));

  const ref = useRef<HTMLInputElement>(null);

  const [keyword, setKeyword] = useState(
    () => parseSearch<Query.KEYWORD>(location.search)[Query.KEYWORD] || '',
  );
  const onKeywordChange = (event: ChangeEvent<HTMLInputElement>) =>
    setKeyword(event.target.value);

  const onSearch = () => {
    if (miniMode) {
      return navigate({
        path: ROOT_PATH.PLAYER,
      });
    }

    const normalizedKeyword = keyword.replace(/\s+/g, ' ').trim();
    return navigate({
      path: ROOT_PATH.PLAYER,
      query: normalizedKeyword
        ? {
            [Query.KEYWORD]: window.encodeURIComponent(normalizedKeyword),
            [Query.PAGE]: 1,
          }
        : {
            [Query.KEYWORD]: null,
            [Query.PAGE]: null,
            [Query.SEARCH_TAB]: null,
          },
    });
  };
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch();
  };

  useEffect(() => {
    const unlistenFocus = eventemitter.listen(
      EventType.FOCUS_SEARCH_INPUT,
      () => ref.current?.focus(),
    );
    return unlistenFocus;
  }, []);

  useEffect(() => {
    setKeyword(parseSearch<Query.KEYWORD>(location.search)[Query.KEYWORD] || '');
  }, [location.search]);

  return (
    <SearchForm onSubmit={onSubmit} autoComplete="off">
      <Input
        ref={ref}
        className="input"
        type="search"
        autoComplete="off"
        value={keyword}
        onChange={onKeywordChange}
        onKeyDown={(event) => {
          if (isComposingEnterKeyDown(event)) {
            event.preventDefault();
          }
        }}
        placeholder={searchLabel}
      />
      <Button
        square
        type="submit"
        size="md"
        aria-label={searchLabel}
        title={searchLabel}
      >
        <Search />
      </Button>
    </SearchForm>
  );
}

export default memo(Wrapper);
