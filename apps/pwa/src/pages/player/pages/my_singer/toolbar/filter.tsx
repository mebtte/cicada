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
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState(
    () => parseSearch<Query.KEYWORD>(location.search).keyword || '',
  );

  useEffect(() => {
    const timer = window.setTimeout(
      () =>
        navigate({
          query: {
            [Query.KEYWORD]: keyword.trim(),
          },
        }),
      500,
    );
    return () => window.clearTimeout(timer);
  }, [keyword, navigate]);

  return (
    <Input
      style={style}
      className="filter"
      inputProps={{
        autoFocus: true,
        placeholder: '查找',
        value: keyword,
        onChange: (event) =>
          setKeyword(event.target.value.replace(/\s+/g, ' ')),
      }}
    />
  );
}

export default Filter;
