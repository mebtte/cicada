import Input from '@/components/input';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import { CSSProperties, useEffect, useState } from 'react';
import { t } from '@/i18n';

const style: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

function Filter() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(
      () =>
        navigate({
          query: {
            [Query.KEYWORD]: keyword.replace(/\s+/g, ' ').trim(),
          },
        }),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [keyword, navigate]);

  return (
    <Input
      style={style}
      value={keyword}
      onChange={(e) => setKeyword(e.target.value)}
      type="search"
      placeholder={t('search')}
    />
  );
}

export default Filter;
