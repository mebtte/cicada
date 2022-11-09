import { HtmlHTMLAttributes, ReactNode } from 'react';
import styled, { css } from 'styled-components';

const Style = styled.div`
  height: 45px;
  padding: 0 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  user-select: none;

  > .one {
    width: 35px;
  }

  > .two {
    min-width: 0;
  }

  > .three {
    width: 40px;

    text-align: right;
  }

  > .four {
    flex: 1;
    min-width: 0;

    text-align: right;
  }

  ${({ theme: { miniMode } }) => css`
    > .two {
      flex: ${miniMode ? 2 : 1};
    }
  `}
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
