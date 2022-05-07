```jsx
import styled from 'styled-components';

import { Name } from '.';

const IconWrapper = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin: 10px 5px;
  > .name {
    font-size: 12px;
    margin-top: 5px;
  }
`;

const Demo = () =>
  Object.values(Name).map((name, index) => (
    <IconWrapper key={index}>
      <Icon name={name} size={24} />
      <div className="name">{name}</div>
    </IconWrapper>
  ));

<Demo />;
```
