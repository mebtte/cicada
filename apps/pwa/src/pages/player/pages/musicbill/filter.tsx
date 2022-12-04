import styled from 'styled-components';
import Input from '@/components/input';
import { useEffect, useState } from 'react';
import { FILTER_HEIGHT } from './constants';
import e, { EventType } from './eventemitter';

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

function Filter({
  musicbillId,
  scrollToTop,
}: {
  musicbillId: string;
  scrollToTop: () => void;
}) {
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      e.emit(EventType.KEYWORD_CHANGE, { keyword });
      window.setTimeout(scrollToTop, 0);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [keyword, scrollToTop]);

  useEffect(() => {
    setKeyword('');
  }, [musicbillId]);

  return (
    <Style>
      <Input
        className="input"
        inputProps={{
          value: keyword,
          onChange: (event) => setKeyword(event.target.value),
          placeholder: '乐单内查找',
        }}
      />
    </Style>
  );
}

export default Filter;
