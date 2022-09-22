import { useEffect, useState } from 'react';
import { TopContent } from '../constants';
import eventemitter, { EventType } from '../eventemitter';

export default () => {
  const [topContent, setTopContent] = useState(TopContent.INFO);

  useEffect(() => {
    const unlistenTopContentChange = eventemitter.listen(
      EventType.TOP_CONTENT_CHANGE,
      ({ topContent: tc }) => setTopContent(tc),
    );
    return unlistenTopContentChange;
  }, []);

  return topContent;
};
