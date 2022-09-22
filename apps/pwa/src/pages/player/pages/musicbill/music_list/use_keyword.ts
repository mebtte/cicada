import { useState, useEffect } from 'react';
import eventemitter, { EventType } from '../eventemitter';

export default () => {
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const unlistenTopContentChange = eventemitter.listen(
      EventType.TOP_CONTENT_CHANGE,
      () => setKeyword(''),
    );
    const unlistenKeywordChange = eventemitter.listen(
      EventType.KEYWORD_CHANGE,
      ({ keyword: k }) => setKeyword(k),
    );
    return () => {
      unlistenTopContentChange();
      unlistenKeywordChange();
    };
  }, []);

  return keyword;
};
