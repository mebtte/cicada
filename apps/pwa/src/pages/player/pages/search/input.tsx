import Input from '#/components/input';
import useNavigate from '#/utils/use_navigate';
import { Query } from '@/constants';
import { CSSProperties, useState } from 'react';

const style: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

function Wrapper({ initialKeyword }: { initialKeyword: string }) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState(initialKeyword);

  return (
    <Input
      className="input"
      inputProps={{
        type: 'search',
        placeholder: '搜索',
        value: keyword,
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
