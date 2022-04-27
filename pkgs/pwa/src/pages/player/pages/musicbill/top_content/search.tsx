import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animated } from 'react-spring';
import styled from 'styled-components';

import Avatar from '@/components/avatar';
import CircularLoader from '@/components/circular_loader';
import Input from '@/components/input';
import IconButton, { Name } from '@/components/icon_button';
import eventemitter, { EventType } from '../eventemitter';
import { TopContent } from '../constants';

const Style = styled(animated.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  > .input-box {
    position: relative;
    > .input {
      width: 250px;
    }
    > .loader {
      position: absolute;
      top: 50%;
      right: 10px;
      transform: translateY(-50%);
    }
  }
`;
const switchToMusicbillInfo = () =>
  eventemitter.emit(EventType.TOP_CONTENT_CHANGE, {
    topContent: TopContent.INFO,
  });

const Search = ({ cover, style }: { cover: string; style: unknown }) => {
  const inputRef = useRef<HTMLInputElement>();
  const [loading, setLoading] = useState(false);

  const [keyword, setKeyword] = useState('');
  const onKeywordChange: React.ChangeEventHandler<HTMLInputElement> = (event) =>
    setKeyword(event.target.value);

  useEffect(() => {
    if (keyword) {
      setLoading(true);
      const timer = window.setTimeout(() => {
        setLoading(false);
        eventemitter.emit(EventType.KEYWORD_CHANGE, { keyword });
      }, 1000);
      return () => window.clearTimeout(timer);
    }

    setLoading(false);
    eventemitter.emit(EventType.KEYWORD_CHANGE, { keyword: '' });
  }, [keyword]);

  useLayoutEffect(() => {
    const timer = window.setTimeout(() => inputRef.current.focus(), 1000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <Style style={style}>
      <Avatar animated src={cover} />
      <div className="input-box">
        <Input
          className="input"
          value={keyword}
          onChange={onKeywordChange}
          ref={inputRef}
        />
        {loading ? <CircularLoader className="loader" size={16} /> : null}
      </div>
      <IconButton name={Name.DOWN_OUTLINE} onClick={switchToMusicbillInfo} />
    </Style>
  );
};

export default Search;
