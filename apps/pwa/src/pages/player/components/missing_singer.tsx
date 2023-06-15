import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import notice from '@/utils/notice';
import { openCreateSingerDialog } from '../utils';

const Style = styled.div`
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  text-decoration: underline;
  cursor: pointer;
`;

function MissingSinger() {
  return (
    <Style onClick={() => openCreateSingerDialog(() => notice.info('已创建'))}>
      找不到歌手?
    </Style>
  );
}

export default MissingSinger;
