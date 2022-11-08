import { HtmlHTMLAttributes, ReactNode } from 'react';
import styled from 'styled-components';

const Style = styled.div`
  height: 45px;
  padding: 0 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  user-select: none;

  > .one {
    width: 40px;
  }

  > .two {
    flex: 1;
    min-width: 0;
  }

  > .three {
    width: 40px;

    text-align: right;
  }

  > .four {
    width: 100px;

    text-align: right;
  }
`;

function Row({
  one,
  two,
  three,
  four,
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & {
  one: ReactNode;
  two: ReactNode;
  three: ReactNode;
  four: ReactNode;
}) {
  return (
    <Style {...props}>
      <div className="one">{one}</div>
      <div className="two">{two}</div>
      <div className="three">{three}</div>
      <div className="four">{four}</div>
    </Style>
  );
}

export default Row;
