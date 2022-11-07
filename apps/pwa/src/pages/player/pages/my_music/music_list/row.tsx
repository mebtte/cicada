import { HtmlHTMLAttributes, ReactNode } from 'react';
import styled from 'styled-components';
import mm from '@/global_states/mini_mode';

const Style = styled.div`
  height: 45px;
  padding: 0 20px;

  display: flex;
  align-items: center;

  > .one {
    width: 40px;
  }

  > .two {
    flex: 1;
    min-width: 0;
  }

  > .three {
    flex: 1;
    min-width: 0;
  }

  > .four {
    width: 40px;

    text-align: right;
  }

  > .five {
    flex: 1;
    min-width: 0;

    text-align: right;
  }
`;

function Row({
  one,
  two,
  three,
  four,
  five,
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & {
  one: ReactNode;
  two: ReactNode;
  three: ReactNode;
  four: ReactNode;
  five: ReactNode;
}) {
  const miniMode = mm.useState();
  return (
    <Style {...props}>
      <div className="one">{one}</div>
      <div className="two">{two}</div>
      <div className="three">{three}</div>
      <div className="four">{four}</div>
      {miniMode ? null : <div className="five">{five}</div>}
    </Style>
  );
}

export default Row;
