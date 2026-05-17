import Input from '@/components/input';
import Button from '@/components/button';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import parseSearch from '@/utils/parse_search';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { t } from '@/i18n';
import capitalize from '@/utils/capitalize';
import styled from 'styled-components';
import { MdSearch } from 'react-icons/md';
import { ROOT_PATH } from '@/constants/route';
import eventemitter, { EventType } from '../../eventemitter';
import { isComposingEnterKeyDown } from '@/utils/keyboard';

const SearchForm = styled.form`
  display: flex;
  align-items: center;
  width: 100%;

  > .search-input {
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
`;

function Wrapper({ autoFocus = true }: { autoFocus?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const ref = useRef<HTMLInputElement>(null);
  const [keyword, setKeyword] = useState(
    () => parseSearch<Query.KEYWORD>(location.search)[Query.KEYWORD] || '',
  );
  const searchLabel = capitalize(t('search'));

  const search = () => {
    const normalizedKeyword = keyword.replace(/\s+/g, ' ').trim();
    navigate({
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
    search();
  };

  useEffect(() => {
    setKeyword(parseSearch<Query.KEYWORD>(location.search)[Query.KEYWORD] || '');
  }, [location.search]);

  useEffect(() => {
    const unlistenFocus = eventemitter.listen(
      EventType.FOCUS_SEARCH_INPUT,
      () => ref.current?.focus(),
    );
    return unlistenFocus;
  }, []);

  return (
    <SearchForm className="input" onSubmit={onSubmit} autoComplete="off">
      <Input
        ref={ref}
        className="search-input"
        type="search"
        placeholder={searchLabel}
        value={keyword}
        autoFocus={autoFocus}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(event) => {
          if (isComposingEnterKeyDown(event)) {
            event.preventDefault();
          }
        }}
      />
      <Button
        square
        type="submit"
        size="md"
        aria-label={searchLabel}
        title={searchLabel}
      >
        <MdSearch />
      </Button>
    </SearchForm>
  );
}

export default Wrapper;
