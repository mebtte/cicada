import Input from '#/components/input';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FILTER_HEIGHT } from './constants';

const Style = styled.div`
  position: absolute;
  width: 100%;
  height: ${FILTER_HEIGHT}px;
  left: 0;
  bottom: 0;

  display: flex;
  align-items: center;

  padding: 0 20px;

  backdrop-filter: blur(5px);

  > .filter {
    flex: 1;
    min-width: 0;
  }
`;

function Filter({ onChange }: { onChange: (keyword: string) => void }) {
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => onChange(keyword), 500);
    return () => window.clearTimeout(timer);
  }, [keyword, onChange]);

  return (
    <Style>
      <Input
        className="filter"
        inputProps={{
          value: keyword,
          onChange: (e) => setKeyword(e.target.value),
          placeholder: '查找',
        }}
      />
    </Style>
  );
}

export default Filter;
