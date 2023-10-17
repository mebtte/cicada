import { CSSVariable } from '@/global_style';
import capitalize from '@/style/capitalize';
import useTitlebarArea from '@/utils/use_titlebar_area_rect';
import { HtmlHTMLAttributes } from 'react';
import styled from 'styled-components';

const Style = styled.div`
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  font-size: ${CSSVariable.TEXT_SIZE_TITLE};
  font-weight: bold;
  ${capitalize}
`;

function Title({ style, ...props }: HtmlHTMLAttributes<HTMLDivElement>) {
  const { height } = useTitlebarArea();
  return (
    <Style
      {...props}
      style={{
        ...style,
        padding: `${height || 20}px 15px 20px 15px`,
      }}
    />
  );
}

export default Title;
