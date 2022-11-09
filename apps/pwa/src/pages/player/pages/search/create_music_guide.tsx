import { memo } from 'react';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { Query } from '@/constants';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { CSSVariable } from '#/global_style';

const Style = styled.div`
  margin: 20px;

  text-align: center;
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};

  > a {
    color: inherit;
  }
`;

function CreateMusicGuide() {
  return (
    <Style>
      找不到想要的音乐? &nbsp;
      <Link
        to={{
          pathname: ROOT_PATH.PLAYER + PLAYER_PATH.MY_MUSIC,
          search: `?${Query.CREATE_MUSIC_DIALOG_OPEN}=1`,
        }}
      >
        自己创建一首
      </Link>
    </Style>
  );
}

export default memo(CreateMusicGuide);
