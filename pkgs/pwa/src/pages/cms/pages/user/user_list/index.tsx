import React from 'react';
import styled from 'styled-components';

import { SearchKey } from '@/server/cms_get_user_list';
import ErrorCard from '@/components/error_card';
import useUserList from './use_user_list';
import Search from './search';
import Pagination from './pagination';
import UserList from './user_list';
import { User } from '../constants';

const Style = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  margin: 20px 20px 20px 0;
  gap: 10px;
`;
const errorCardStyle = {
  flex: 1,
  minHeight: 0,
};

const Wrapper = ({
  selectedUserList,
  searchKey,
  searchValue,
  page,
}: {
  selectedUserList: User[];
  searchKey: SearchKey;
  searchValue: string;
  page: number;
}) => {
  const { error, loading, total, retry, userList } = useUserList({
    searchKey,
    searchValue,
    page,
  });

  return (
    <Style>
      <Search searchKey={searchKey} searchValue={searchValue} />
      {error ? (
        <ErrorCard
          errorMessage={error.message}
          retry={retry}
          style={errorCardStyle}
        />
      ) : (
        <UserList
          selectedUserList={selectedUserList}
          userList={userList}
          loading={loading}
          page={page}
          searchKey={searchKey}
          searchValue={searchValue}
        />
      )}
      <Pagination page={page} total={total} />
    </Style>
  );
};

export default Wrapper;
