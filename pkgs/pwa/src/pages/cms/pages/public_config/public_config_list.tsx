import React from 'react';
import styled, { css } from 'styled-components';

import useHistory from '@/utils/use_history';
import absoluteCenter from '@/style/absolute_center';
import IconButton, { Name } from '@/components/icon_button';
import ErrorCard from '@/components/error_card';
import Table from '@/components/table';
import scrollbarAsNeeded from '@/style/scrollbar_as_needed';
import CircularLoader from '@/components/circular_loader';
import usePublicConfigList from './use_public_config_list';
import { PublicConfig as PublicConfigType, Query } from './constants';
import eventemitter, { EventType } from './eventemitter';

const errorCardStyle = {
  flex: 1,
  minWidth: 0,
};
const Style = styled.div<{ isLoading: boolean }>`
  flex: 1;
  min-width: 0;
  position: relative;

  > .table {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;

    box-sizing: border-box;
    padding: 20px 20px 20px 0;

    overflow: auto;
    ${scrollbarAsNeeded}

    table {
      width: 100%;
    }
  }

  > .loader {
    ${absoluteCenter}
  }

  ${({ isLoading }) => css`
    > .table {
      opacity: ${isLoading ? 0.5 : 1};
    }
  `}
`;
const ActionBox = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;
const ACTION_SIZE = 22;
const headers = ['键', '描述', '值', '操作'];

const PublicConfigList = () => {
  const history = useHistory();
  const { error, retry, loading, publicConfigList } = usePublicConfigList();

  if (error) {
    return (
      <ErrorCard
        errorMessage={new Error('test').message}
        retry={retry}
        style={errorCardStyle}
      />
    );
  }

  const rowRenderer = (pc: PublicConfigType) => [
    pc.key,
    pc.description,
    pc.value,
    <ActionBox>
      <IconButton
        name={Name.EDIT_OUTLINE}
        size={ACTION_SIZE}
        onClick={() => eventemitter.emit(EventType.OPEN_UPDATE_DIALOG, pc)}
      />
      <IconButton
        name={Name.HISTORY_OUTLINE}
        size={ACTION_SIZE}
        onClick={() =>
          history.push({
            query: {
              [Query.OPERATE_RECORD_DIALOG_OPEN]: '1',
              [Query.OPERATE_RECORD_DIALOG_KEY]: pc.key,
            },
          })
        }
      />
    </ActionBox>,
  ];
  return (
    <Style isLoading={loading}>
      <div className="table">
        <Table
          stickyHeader
          list={publicConfigList}
          headers={headers}
          rowRenderer={rowRenderer}
        />
      </div>
      {loading ? <CircularLoader className="loader" /> : null}
    </Style>
  );
};

export default PublicConfigList;
