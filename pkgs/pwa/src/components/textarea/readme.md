```jsx
import { useState, useCallback } from 'react';

const style = {
  height: 100,
};

const Demo = () => {
  const [value, setValue] = useState('');
  const onValueChange = useCallback(
    (event) => setValue(event.target.value),
    [],
  );

  return (
    <Textarea
      value={value}
      onChange={onValueChange}
      placeholder="请输入文本"
      style={style}
    />
  );
};

<Demo />;
```

Disabled

```jsx
import { useState, useCallback } from 'react';

const style = {
  height: 100,
};

const Demo = () => {
  const [value, setValue] = useState('');
  const onValueChange = useCallback(
    (event) => setValue(event.target.value),
    [],
  );

  return (
    <Textarea
      value={value}
      onChange={onValueChange}
      placeholder="请输入文本"
      style={style}
      disabled
    />
  );
};

<Demo />;
```
