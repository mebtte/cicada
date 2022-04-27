import { useState, useEffect } from 'react';

import eventemitter, { EventType } from '../eventemitter';

export default () => {
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const onTopContentChange = () => setKeyword('');
    const onKeywordChange = ({ keyword: k }: { keyword: string }) =>
      setKeyword(k);

    eventemitter.on(EventType.TOP_CONTENT_CHANGE, onTopContentChange);
    eventemitter.on(EventType.KEYWORD_CHANGE, onKeywordChange);
    return () => {
      eventemitter.off(EventType.TOP_CONTENT_CHANGE, onTopContentChange);
      eventemitter.off(EventType.KEYWORD_CHANGE, onKeywordChange);
    };
  }, []);

  return keyword;
};
