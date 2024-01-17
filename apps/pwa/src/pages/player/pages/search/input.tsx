import Input from '@/components/input';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import parseSearch from '@/utils/parse_search';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { t } from '@/i18n';
import capitalize from '#/utils/capitalize';

function Wrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const [keyword, setKeyword] = useState(
    () => parseSearch<Query.KEYWORD>(location.search)[Query.KEYWORD] || '',
  );

  return (
    <Input
      className="input"
      type="search"
      placeholder={capitalize(t('search'))}
      value={keyword}
      autoFocus
      onChange={(e) => setKeyword(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          navigate({
            query: {
              [Query.KEYWORD]: window.encodeURIComponent(
                keyword.replace(/\s+/g, ' ').trim(),
              ),
            },
          });
        }
      }}
    />
  );
}

export default Wrapper;
