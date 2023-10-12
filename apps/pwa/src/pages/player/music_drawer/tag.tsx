import { CSSVariable } from '@/global_style';
import { ReactNode } from 'react';
import styled from 'styled-components';

const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;

  color: ${CSSVariable.TEXT_COLOR_SECONDARY};

  > .icon {
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    line-height: 1;
  }

  > .text {
    font-family: monospace;
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  }
`;

function Tag({
  title,
  icon,
  text,
}: {
  title: string;
  icon: ReactNode;
  text: string | number;
}) {
  return (
    <Style title={title}>
      <div className="icon">{icon}</div>
      <div className="text">{text}</div>
    </Style>
  );
}

export default Tag;
