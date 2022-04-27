```jsx
import { useState, useCallback } from 'react';

import { Title, Content, Action } from '.';
import Button from '../button';

const Demo = () => {
  const [open, setOpen] = useState(false);
  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);
  return (
    <>
      <Button label="Open" onClick={onOpen} />
      <Dialog open={open}>
        <Title>标题</Title>
        <Content>内容</Content>
        <Action>
          <Button label="Close" onClick={onClose} />
        </Action>
      </Dialog>
    </>
  );
};

<Demo />;
```
