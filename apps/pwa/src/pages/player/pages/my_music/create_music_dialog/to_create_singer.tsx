import { CSSVariable } from '#/global_style';
import { Query } from '@/constants';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Style = styled(Link)`
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  text-decoration: underline;
`;

function ToCreateSinger() {
  return (
    <Style
      to={`${ROOT_PATH.PLAYER}${PLAYER_PATH.MY_SINGER}?${Query.CREATE_SINGER_DIALOG_OPEN}=1`}
    >
      找不到歌手?
    </Style>
  );
}

export default ToCreateSinger;
