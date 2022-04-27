import React from 'react';

import useHistory from '@/utils/use_history';
import Pagination from '@/components/pagination';
import { PAGE_SIZE, Query } from '../constants';

const Wrapper = ({ page, total }: { page: number; total: number }) => {
  const history = useHistory();
  const onPageChange = (p: number) =>
    history.push({ query: { [Query.PAGE]: p.toString() } });

  return (
    <Pagination
      currentPage={page}
      pageCount={Math.ceil(total / PAGE_SIZE)}
      onPageChange={onPageChange}
    />
  );
};

export default Wrapper;
