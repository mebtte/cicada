import { CSSVariable } from '@/global_style';
import capitalize from '@/style/capitalize';
import { HtmlHTMLAttributes } from 'react';
import styled from 'styled-components';

const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;

  border-radius: ${CSSVariable.BORDER_RADIUS_NORMAL};
  background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};

  > .label {
    flex: 1;
    min-width: 0;

    font-weight: bold;
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};

    ${capitalize}
  }

  &:hover {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  }
`;

function Item({
  label,
  children,
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & {
  label: string;
}) {
  return (
    <Style {...props}>
      <div className="label">{label}</div>
      {children}
    </Style>
  );
}

export default Item;
