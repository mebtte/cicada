import useNavigate from '#/utils/use_navigate';
import Pagination from '@/components/pagination';
import { MusicWithIndex } from '@/pages/player/constants';
import ScrollablePage from './scrollable_page';
import Music from '../../components/music';
import { Query, PAGE_SIZE } from './constants';

const paginationStyle = {
  padding: '10px 0',
};

function MusicList({
  page,
  musicList,
  total,
}: {
  page: number;
  musicList: MusicWithIndex[];
  total: number;
}) {
  const navigate = useNavigate();

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
          navigate({
            query: {
              [Query.PAGE]: p.toString(),
            },
          })
        }
        style={paginationStyle}
      />
    </ScrollablePage>
  );
}

export default MusicList;
