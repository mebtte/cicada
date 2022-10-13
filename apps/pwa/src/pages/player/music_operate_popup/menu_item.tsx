import styled from 'styled-components';
import Icon, { Name } from '@/components/icon';
import { HtmlHTMLAttributes, ReactNode } from 'react';

const Style = styled.div`
  padding: 10px 20px;

  display: flex;
  align-items: center;

  user-select: none;
  cursor: pointer;
  transition: all 300ms;

  > .label {
    margin-left: 20px;
    font-size: 12px;
  }

  > svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background-color: rgb(0 0 0 / 0.05);
  }

  &:active {
    background-color: rgb(0 0 0 / 0.1);
  }
`;

function MenuItem({
  icon,
  label,
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & {
  icon: Name | ReactNode;
  label: string;
}) {
  return (
    <Style {...props}>
      {typeof icon === 'string' ? (
        <Icon className="icon" name={icon} size={14} />
      ) : (
        icon
      )}
      <div className="label">{label}</div>
    </Style>
  );
}

export default MenuItem;
