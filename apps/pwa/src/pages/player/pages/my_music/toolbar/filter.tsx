import Input from '#/components/input';
import useNavigate from '#/utils/use_navigate';
import { Query } from '@/constants';
import parseSearch from '@/utils/parse_search';
import { CSSProperties, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const style: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

function Filter() {
  const location = useLocation();

  const [keyword, setKeyword] = useState(() => {
    const query = parseSearch<Query.KEYWORD>(location.search);
    return query.keyword || '';
  });
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(
      () =>
        navigate({
          query: {
            [Query.KEYWORD]: keyword.replace(/\s+/g, ' ').trim(),
            [Query.PAGE]: 1,
          },
        }),
      500,
    );
    return () => window.clearTimeout(timer);
  }, [keyword, navigate]);

  return (
    <Input
      style={style}
      inputProps={{
        placeholder: '查找',
        value: keyword,
        onChange: (event) => setKeyword(event.target.value),
      }}
    />
  );
}

export default Filter;
