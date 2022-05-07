Type

```jsx
import { Name, Type } from '.';

const style = {
  marginRight: 20,
};

const Demo = () => (
  <>
    <IconButton name={Name.SETTING_OUTLINE} type={Type.NORMAL} style={style} />
    <IconButton name={Name.SETTING_OUTLINE} type={Type.PRIMARY} style={style} />
    <IconButton name={Name.SETTING_OUTLINE} type={Type.DANGER} style={style} />
  </>
);

<Demo />;
```

Disabled

```jsx
import { Name, Type } from '.';

const style = {
  marginRight: 20,
};

const Demo = () => (
  <>
    <IconButton
      name={Name.SETTING_OUTLINE}
      type={Type.NORMAL}
      disabled
      style={style}
    />
    <IconButton
      name={Name.SETTING_OUTLINE}
      type={Type.PRIMARY}
      disabled
      style={style}
    />
    <IconButton
      name={Name.SETTING_OUTLINE}
      type={Type.DANGER}
      disabled
      style={style}
    />
  </>
);

<Demo />;
```

Loading

```jsx
import { Name, Type } from '.';

const style = {
  marginRight: 20,
};

const Demo = () => (
  <>
    <IconButton
      name={Name.SETTING_OUTLINE}
      type={Type.NORMAL}
      loading
      style={style}
    />
    <IconButton
      name={Name.SETTING_OUTLINE}
      type={Type.PRIMARY}
      loading
      style={style}
    />
    <IconButton
      name={Name.SETTING_OUTLINE}
      type={Type.DANGER}
      loading
      style={style}
    />
  </>
);

<Demo />;
```
