import { useEffect, useState } from 'react';

import { TopContent } from '../constants';
import eventemitter, { EventType } from '../eventemitter';

export default () => {
  const [topContent, setTopContent] = useState(TopContent.INFO);

  useEffect(() => {
    const onTopContentChange = ({
      topContent: tc,
    }: {
      topContent: TopContent;
    }) => setTopContent(tc);
    eventemitter.on(EventType.TOP_CONTENT_CHANGE, onTopContentChange);
    return () =>
      void eventemitter.off(EventType.TOP_CONTENT_CHANGE, onTopContentChange);
  }, []);

  return topContent;
};
