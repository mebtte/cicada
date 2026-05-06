import styled from 'styled-components';
import Input from '@/components/input';
import { useEffect, useMemo, useState } from 'react';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import { t } from '@/i18n';
import { FILTER_HEIGHT } from './constants';
import capitalize from '@/utils/capitalize';
import { useLocation } from 'react-router-dom';
import parseSearch from '@/utils/parse_search';

const Style = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: ${FILTER_HEIGHT}px;

  backdrop-filter: blur(5px);

  display: flex;
  align-items: center;

  padding: 0 20px;

  > .input {
    flex: 1;
    min-width: 0;
  }
`;

const normalizeKeyword = (keyword: string) =>
  keyword.replace(/\s+/g, ' ').trim();

function Filter() {
  const location = useLocation();
  const queryKeyword = useMemo(() => {
    const query = parseSearch<Query.KEYWORD>(location.search);
    return query[Query.KEYWORD] || '';
  }, [location.search]);
  const [keyword, setKeyword] = useState(queryKeyword);
  const navigate = useNavigate();

  useEffect(() => setKeyword(queryKeyword), [queryKeyword]);

  useEffect(() => {
    const normalizedKeyword = normalizeKeyword(keyword);
    if (normalizedKeyword === queryKeyword) {
      return;
    }

    const timer = window.setTimeout(
      () =>
        navigate({
          query: {
            [Query.KEYWORD]: normalizedKeyword || undefined,
          },
          replace: true,
        }),
      500,
    );
    return () => window.clearTimeout(timer);
  }, [keyword, navigate, queryKeyword]);

  return (
    <Style>
      <Input
        className="input"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder={capitalize(t('find_in_musicbill'))}
      />
    </Style>
  );
}

export default Filter;
