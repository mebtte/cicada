import Input from '#/components/input';
import useNavigate from '#/utils/use_navigate';
import { Query } from '@/constants';
import parseSearch from '@/utils/parse_search';
import { CSSProperties, useState } from 'react';
import { useLocation } from 'react-router-dom';

const style: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

function Wrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const [keyword, setKeyword] = useState(
    () => parseSearch<Query.KEYWORD>(location.search)[Query.KEYWORD] || '',
  );

  return (
    <Input
      className="input"
      inputProps={{
        type: 'search',
        placeholder: '搜索',
        value: keyword,
        autoFocus: true,
        onChange: (e) => setKeyword(e.target.value),
        onKeyDown: (e) => {
          if (e.key === 'Enter') {
            navigate({
              query: {
                [Query.KEYWORD]: keyword.replace(/\s+/g, ' ').trim(),
              },
            });
          }
        },
      }}
      style={style}
    />
  );
}

export default Wrapper;
