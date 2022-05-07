```jsx
import { Type } from '.';

<>
  {Object.values(Type).map((t) => (
    <Tag key={t} type={t} />
  ))}
</>;
```
