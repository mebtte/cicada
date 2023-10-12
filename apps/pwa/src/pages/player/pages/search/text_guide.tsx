import { memo } from 'react';
import styled from 'styled-components';
import { CSSVariable } from '@/global_style';

const Style = styled.div`
  margin: 20px;

  text-align: center;
  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};

  > .create {
    text-decoration: underline;
    cursor: pointer;
  }
`;

function TextGuide({
  text1,
  text2,
  onGuide,
}: {
  text1: string;
  text2: string;
  onGuide: () => void;
}) {
  return (
    <Style>
      {text1} &nbsp;
      <span className="create" onClick={onGuide}>
        {text2}
      </span>
    </Style>
  );
}

export default memo(TextGuide);
