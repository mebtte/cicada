import styled from 'styled-components';
import Tag, { Type } from '#/components/tag';
import { HtmlHTMLAttributes } from 'react';
import { Music } from '../constants';

const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;

  &:empty {
    display: none;
  }
`;

function MusicTagList({
  music,
  ...props
}: {
  music: Music;
} & HtmlHTMLAttributes<HTMLDivElement>) {
  const { hq, ac } = music;
  return (
    <Style {...props}>
      {hq ? <Tag type={Type.HQ} /> : null}
      {ac ? <Tag type={Type.AC} /> : null}
    </Style>
  );
}

export default MusicTagList;
