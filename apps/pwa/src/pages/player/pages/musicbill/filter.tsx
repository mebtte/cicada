import styled from 'styled-components';
import Input from '@/components/input';
import { useEffect, useState } from 'react';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import { t } from '@/i18n';
import upperCaseFirstLetter from '#/utils/upper_case_first_letter';
import { FILTER_HEIGHT } from './constants';

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

function Filter() {
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(
      () =>
        navigate({
          query: {
            [Query.KEYWORD]: keyword,
          },
        }),
      500,
    );
    return () => window.clearTimeout(timer);
  }, [keyword, navigate]);

  return (
    <Style>
      <Input
        className="input"
        inputProps={{
          value: keyword,
          onChange: (event) => setKeyword(event.target.value),
          placeholder: upperCaseFirstLetter(t('find_in_musicbill')),
        }}
      />
    </Style>
  );
}

export default Filter;
