import React, { useLayoutEffect, useRef } from 'react';
import styled from 'styled-components';

import useHistory from '@/utils/use_history';
import Label from '@/components/label';
import Input from '@/components/input';
import { CMS_PATH } from '@/constants/route';
import { Query as MusicQuery } from '../music/constants';
import { Query as FigureQuery } from '../figure/constants';
import { Query as UserQuery } from '../user/constants';

const Style = styled.div`
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  > .part {
    flex: 1;
    .input {
      width: 100%;
    }
  }
`;

const Search = () => {
  const history = useHistory();

  const musicRef = useRef<HTMLInputElement>();
  const onMusicSearch = () =>
    history.push({
      pathname: CMS_PATH.MUSIC,
      query: {
        [MusicQuery.SEARCH_VALUE]: musicRef.current.value,
      },
    });
  const onMusicKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onMusicSearch();
    }
  };

  const figureRef = useRef<HTMLInputElement>();
  const onFigureSearch = () =>
    history.push({
      pathname: CMS_PATH.FIGURE,
      query: {
        [FigureQuery.SEARCH_VALUE]: figureRef.current.value,
      },
    });
  const onFigureKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onFigureSearch();
    }
  };

  const userRef = useRef<HTMLInputElement>();
  const onUserSearch = () =>
    history.push({
      pathname: CMS_PATH.USER,
      query: {
        [UserQuery.SEARCH_VALUE]: userRef.current.value,
      },
    });
  const onUserKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onUserSearch();
    }
  };

  useLayoutEffect(() => {
    musicRef.current.focus();
  }, []);

  return (
    <Style>
      <Label label="搜索音乐" className="part">
        <Input className="input" ref={musicRef} onKeyDown={onMusicKeyDown} />
      </Label>
      <Label label="搜索角色" className="part">
        <Input className="input" ref={figureRef} onKeyDown={onFigureKeyDown} />
      </Label>
      <Label label="搜索用户" className="part">
        <Input className="input" ref={userRef} onKeyDown={onUserKeyDown} />
      </Label>
    </Style>
  );
};

export default Search;
