```jsx
import { Placement } from '.';

const placements = [
  {
    placement: Placement.LEFT,
    label: 'left',
  },
  {
    placement: Placement.TOP,
    label: 'top',
  },
  {
    placement: Placement.RIGHT,
    label: 'right',
  },
  {
    placement: Placement.BOTTOM,
    label: 'bottom',
  },
];
const Demo = () =>
  placements.map(({ placement, label }) => (
    <Tooltip title={label} placement={placement}>
      <button type="button">{label}</button>
    </Tooltip>
  ));

<Demo />;
```
