import React, { ReactNode } from 'react';
import styled, { css } from 'styled-components';

import CircularLoader from '@/components/circular_loader';
import Pagination from '@/components/pagination';
import Empty from '@/components/empty';
import ErrorCard from '@/components/error_card';
import useHistory from '@/utils/use_history';
import Dialog, { Title, Content } from '@/components/dialog';
import { PublicConfigKey } from '@/constants/public_config';
import { Query } from '../constants';
import useOperateRecordList from './use_operate_record_list';
import RecordList from './record_list';
import { PAGE_SIZE } from './constants';

const bodyProps = {
  style: { width: 650 },
};
const cardStyle = {
  padding: '50px 0',
};
const TableBox = styled.div<{ isLoading: boolean }>`
  position: relative;
  min-height: 150px;
  margin-bottom: 10px;
  table {
    width: 100%;
  }
  > .loader {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  ${({ isLoading }) => css`
    table {
      opacity: ${isLoading ? '0.5' : '1'};
    }
  `}
`;

const OperateRecordDialog = ({
  open,
  key,
}: {
  open: boolean;
  key?: PublicConfigKey;
}) => {
  const history = useHistory();
  const onClose = () =>
    history.push({
      query: {
        [Query.OPERATE_RECORD_DIALOG_OPEN]: '',
      },
    });

  const { error, retry, loading, recordList, page, onPageChange, total } =
    useOperateRecordList({
      open,
      key,
    });

  let content: ReactNode;
  if (error) {
    content = (
      <ErrorCard errorMessage={error.message} retry={retry} style={cardStyle} />
    );
  } else if (!loading && !recordList.length) {
    content = <Empty description="暂无操作记录" style={cardStyle} />;
  } else {
    content = (
      <>
        <TableBox isLoading={loading}>
          <RecordList recordList={recordList} />
          {loading ? <CircularLoader className="loader" /> : null}
        </TableBox>
        <Pagination
          currentPage={page}
          pageCount={Math.ceil(total / PAGE_SIZE)}
          onPageChange={onPageChange}
        />
      </>
    );
  }
  return (
    <Dialog open={open} onClose={onClose} bodyProps={bodyProps}>
      <Title>操作记录</Title>
      <Content>{content}</Content>
    </Dialog>
  );
};

export default React.memo(OperateRecordDialog);
