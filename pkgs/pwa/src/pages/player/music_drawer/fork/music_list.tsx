import React from 'react';
import styled from 'styled-components';

import { Music } from '../../constants';
import MusicInfo from '../../components/music_info';

const Style = styled.div`
  padding: 10px;
  border-radius: 4px;
  background-color: #f6f6f6;
  > .title {
    font-size: 12px;
    color: rgb(155 155 155);
    margin-bottom: 10px;
  }
  > .list {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
`;

const MusicList = ({
  label,
  musicList,
}: {
  label: string;
  musicList: Music[];
}) => (
  <Style>
    <div className="title">{label}</div>
    <div className="list">
      {musicList.map((m) => (
        <MusicInfo key={m.id} music={m} />
      ))}
    </div>
  </Style>
);

export default MusicList;
