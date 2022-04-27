import React, { useState, useEffect } from 'react';
import JSONView from 'react-json-view';

import Dialog, { Content } from '@/components/dialog';
import eventemitter, { EventType } from './eventemitter';

const bodyProps = {
  style: { width: 750 },
};

const JsonViewDialog = () => {
  const [open, setOpen] = useState(false);
  const onClose = () => setOpen(false);

  const [json, setJson] = useState<Object>({});
  useEffect(() => {
    const openListener = ({ json: j }: { json: Object }) => {
      setJson(j);
      return setOpen(true);
    };
    eventemitter.on(EventType.VIEW_JSON, openListener);
    return () => void eventemitter.off(EventType.VIEW_JSON, openListener);
  }, []);
  return (
    <Dialog open={open} onClose={onClose} bodyProps={bodyProps}>
      <Content>
        <JSONView src={json} enableClipboard={false} />
      </Content>
    </Dialog>
  );
};

export default React.memo(JsonViewDialog);
