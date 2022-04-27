Type & Disabled

```jsx
import { Type } from '.';

const style = {
  marginRight: 20,
};

const Demo = () => (
  <>
    <Button label="enable" style={style} />
    <Button label="disabled" disabled style={style} />
    <br />
    <br />
    <Button label="enable" type={Type.PRIMARY} style={style} />
    <Button label="disabled" disabled type={Type.PRIMARY} style={style} />
    <br />
    <br />
    <Button label="enable" type={Type.DANGER} style={style} />
    <Button label="disabled" disabled type={Type.DANGER} style={style} />
  </>
);

<Demo />;
```

Loading

```jsx
import { Type } from '.';

const style = {
  marginRight: 20,
};

const Demo = () => (
  <>
    <Button label="primary" type={Type.PRIMARY} style={style} />
    <Button label="primary" loading type={Type.PRIMARY} style={style} />
  </>
);

<Demo />;
```

Block

```jsx
import { Type } from '.';

const style = {
  marginBottom: 20,
};

const Demo = () => (
  <>
    <Button label="normal" block type={Type.NORMAL} style={style} />
    <Button label="normal" block type={Type.PRIMARY} style={style} />
    <Button label="normal" block type={Type.DANGER} style={style} />
  </>
);

<Demo />;
```
