```jsx
import { useState } from 'react';

const Demo = () => {
  const [open, setOpen] = useState(false);

  return <Switch open={open} onChange={setOpen} />;
};

<Demo />;
```

Disabled:

```jsx
<>
  <Switch open disabled />
  <Switch open={false} disabled />
</>
```

Loading:

```jsx
<Switch open loading />
```
