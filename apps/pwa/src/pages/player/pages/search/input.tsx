import Input from '@/components/input';
import Button from '@/components/button';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import parseSearch from '@/utils/parse_search';
import { FormEvent, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { t } from '@/i18n';
import capitalize from '@/utils/capitalize';
import styled from 'styled-components';
import { MdSearch } from 'react-icons/md';

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

function Wrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const [keyword, setKeyword] = useState(
    () => parseSearch<Query.KEYWORD>(location.search)[Query.KEYWORD] || '',
  );
  const searchLabel = capitalize(t('search'));

  const search = () =>
    navigate({
      query: {
        [Query.KEYWORD]: window.encodeURIComponent(
          keyword.replace(/\s+/g, ' ').trim(),
        ),
      },
    });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    search();
  };

  return (
    <SearchForm className="input" onSubmit={onSubmit}>
      <Input
        className="search-input"
        type="search"
        placeholder={searchLabel}
        value={keyword}
        autoFocus
        onChange={(e) => setKeyword(e.target.value)}
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
