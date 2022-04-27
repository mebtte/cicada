import React from 'react';

import useHistory from '@/utils/use_history';
import Pagination from '@/components/pagination';
import ScrollablePage from '../scrollable_page';
import { Query, PAGE_SIZE, MusicWithIndexAndLrc } from '../constants';
import Music from './music';

const paginationStyle = {
  padding: '10px 0',
};

const MusicList = ({
  searchValue,
  page,
  musicList,
  total,
}: {
  searchValue: string;
  page: number;
  musicList: MusicWithIndexAndLrc[];
  total: number;
}) => {
  const history = useHistory();

  return (
    <ScrollablePage>
      <div className="list">
        {musicList.map((m) => (
          <Music key={m.index} keyword={searchValue} music={m} />
        ))}
      </div>
      <Pagination
        currentPage={page}
        pageCount={Math.ceil(total / PAGE_SIZE)}
        onPageChange={(p) =>
          history.push({
            query: {
              [Query.PAGE]: p.toString(),
            },
          })
        }
        style={paginationStyle}
      />
    </ScrollablePage>
  );
};

export default MusicList;
