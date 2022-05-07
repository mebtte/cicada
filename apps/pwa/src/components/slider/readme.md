```jsx
import { useState, useCallback } from 'react';

const Demo = () => {
  const [value, setValue] = useState(Math.random());
  const onChange = useCallback((v) => setValue(v), []);
  return <Slider value={value} onChange={onChange} />;
};

<Demo />;
```
