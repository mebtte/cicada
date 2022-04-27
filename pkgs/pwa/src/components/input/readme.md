```jsx
import { useState, useCallback } from 'react';

const Demo = () => {
  const [value, setValue] = useState('');
  const onValueChange = useCallback(
    (event) => setValue(event.target.value),
    [],
  );

  return (
    <Input value={value} onChange={onValueChange} placeholder="请输入文本" />
  );
};

<Demo />;
```

Disabled

```jsx
import { useState, useCallback } from 'react';

const Demo = () => {
  const [value, setValue] = useState('');
  const onValueChange = useCallback(
    (event) => setValue(event.target.value),
    [],
  );

  return (
    <Input
      value={value}
      onChange={onValueChange}
      placeholder="请输入文本"
      disabled
    />
  );
};

<Demo />;
```
