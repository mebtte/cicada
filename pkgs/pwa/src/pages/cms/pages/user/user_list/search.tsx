import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { IS_MAC_OS, IS_WINDOWS } from '@/constants';
import keyboardHandlerWrapper from '@/utils/keyboard_handler_wrapper';
import {
  SearchKey,
  SEARCH_KEY_MAP,
  SEARCH_KEYS,
  SEARCH_VALUE_MAX_LENGTH,
} from '@/server/cms_get_user_list';
import Select from '@/components/select';
import useHistory from '@/utils/use_history';
import Input from '@/components/input';
import IconButton, { Name } from '@/components/icon_button';
import { Query } from '../constants';

const Style = styled.div`
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 5px;
  > .key {
    width: 120px;
  }
  > .value {
    flex: 1;
    min-width: 0;
  }
`;
const itemRenderer = (key: SearchKey | null) => {
  if (!key) {
    return null;
  }
  return SEARCH_KEY_MAP[key].label;
};

const Search = ({
  searchKey,
  searchValue: initialSearchValue,
}: {
  searchKey: SearchKey;
  searchValue: string;
}) => {
  const history = useHistory();
  const inputRef = useRef<HTMLInputElement>();

  const [searchValue, setSearchValue] = useState(initialSearchValue);
  const onSearchValueChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setSearchValue(event.target.value);
  const onSearch = () =>
    history.push({
      query: {
        [Query.PAGE]: '1',
        [Query.SEARCH_VALUE]: searchValue,
      },
    });
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch();
    }
  };
  const onFocus = (event: React.FocusEvent<HTMLInputElement>) =>
    event.target.select();
  const onSearchKeyChange = (key: SearchKey) =>
    history.push({
      query: { [Query.PAGE]: '1', [Query.SEARCH_KEY]: key },
    });

  useEffect(() => {
    const onDocumentKeyDown = keyboardHandlerWrapper((event: KeyboardEvent) => {
      if (
        event.key !== 'f' ||
        (IS_MAC_OS && !event.metaKey) ||
        (IS_WINDOWS && !event.ctrlKey)
      ) {
        return;
      }
      event.preventDefault();
      return inputRef.current.focus();
    });
    document.addEventListener('keydown', onDocumentKeyDown);
    return () => document.removeEventListener('keydown', onDocumentKeyDown);
  }, []);

  return (
    <Style>
      <Select
        className="key"
        value={searchKey}
        onChange={onSearchKeyChange}
        onFocus={onFocus}
        array={SEARCH_KEYS}
        itemRenderer={itemRenderer}
        customInputDisabled
      />
      <Input
        className="value"
        value={searchValue}
        onChange={onSearchValueChange}
        onKeyDown={onKeyDown}
        ref={inputRef}
        maxLength={SEARCH_VALUE_MAX_LENGTH}
      />
      <IconButton name={Name.SEARCH_OUTLINE} onClick={onSearch} />
    </Style>
  );
};

export default Search;
