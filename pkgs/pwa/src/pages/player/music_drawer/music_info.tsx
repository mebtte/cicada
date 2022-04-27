import React from 'react';
import styled from 'styled-components';

import Scrollable from '@/components/scrollable';
import { Music } from '../constants';
import Singer from '../components/singer';
import MusicTagList from '../components/music_tag_list';

const Style = styled.div`
  > .top {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    > .text {
      white-space: nowrap;
      .name {
        font-size: 22px;
        color: rgb(55 55 55);
      }
      .alias {
        margin-left: 5px;
        font-size: 14px;
        color: rgb(155 155 155);
      }
    }
    > .tag {
      margin-top: 6px;
    }
  }
  > .singer-list {
    margin-top: 10px;
    font-size: 12px;
    white-space: nowrap;
  }
`;

const MusicInfo = ({ music }: { music: Music }) => (
  <Style>
    <div className="top">
      <Scrollable className="text">
        <span className="name">{music.name}</span>
        {music.alias ? <span className="alias">{music.alias}</span> : null}
      </Scrollable>
      <MusicTagList className="tag" music={music} />
    </div>
    <Scrollable className="singer-list">
      {music.singers.length ? (
        music.singers.map((s) => <Singer key={s.id} singer={s} />)
      ) : (
        <Singer />
      )}
    </Scrollable>
  </Style>
);

export default MusicInfo;
