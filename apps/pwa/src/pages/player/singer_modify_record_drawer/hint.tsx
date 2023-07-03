import styled from 'styled-components';
import { SINGER_MODIFY_RECORD_TTL } from '#/constants';
import { CSSVariable } from '@/global_style';

const Style = styled.div`
  padding: 10px;

  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  text-align: center;
`;

function Hint() {
  return (
    <Style>
      歌手修改记录保留时间为&nbsp;
      {SINGER_MODIFY_RECORD_TTL / (1000 * 60 * 60 * 24)}
      &nbsp;天
    </Style>
  );
}

export default Hint;
