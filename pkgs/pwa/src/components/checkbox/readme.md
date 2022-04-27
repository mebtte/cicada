```jsx
import { useState, useCallback } from 'react';

const Demo = () => {
  const [checked, setChecked] = useState(true);
  const onChange = useCallback((c) => setChecked(c), []);
  return <Checkbox checked={checked} onChange={onChange} />;
};

<Demo />;
```

Disabled

```jsx
<>
  <Checkbox disabled />
  <Checkbox checked disabled />
</>
```
