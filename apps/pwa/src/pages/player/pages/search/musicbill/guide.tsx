import { memo } from 'react';
import styled from 'styled-components';
import { CSSVariable } from '#/global_style';
import { openCreateMusicbillDialog } from '../../../utils';

const Style = styled.div`
  margin: 20px;

  text-align: center;
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};

  > .create {
    text-decoration: underline;
    cursor: pointer;
  }
`;

function Guide() {
  return (
    <Style>
      找不到想要的歌单? &nbsp;
      <span className="create" onClick={openCreateMusicbillDialog}>
        自己创建一个
      </span>
    </Style>
  );
}

export default memo(Guide);
