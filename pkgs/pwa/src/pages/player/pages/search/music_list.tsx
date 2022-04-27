import React from 'react';

import useHistory from '@/utils/use_history';
import Pagination from '@/components/pagination';
import { MusicWithIndex } from '@/pages/player/constants';
import ScrollablePage from './scrollable_page';
import Music from '../../components/music';
import { Query, PAGE_SIZE } from './constants';

const paginationStyle = {
  padding: '10px 0',
};

const MusicList = ({
  page,
  musicList,
  total,
}: {
  page: number;
  musicList: MusicWithIndex[];
  total: number;
}) => {
  const history = useHistory();

  return (
    <ScrollablePage>
      <div className="list">
        {musicList.map((m) => (
          <Music key={m.index} musicWithIndex={m} />
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
