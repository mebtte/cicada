import absoluteFullSize from '#/style/absolute_full_size';
import { flexCenter } from '#/style/flexbox';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import Spinner from '#/components/spinner';
import Empty from '@/components/empty';
import Pagination from '#/components/pagination';
import useNavigate from '#/utils/use_navigate';
import { Query } from '@/constants';
import { CSSProperties } from 'react';
import Button, { Variant } from '#/components/button';
import { NAME_MAX_LENGTH } from '#/constants/singer';
import playerEventemitter, {
  EditDialogType,
  EventType as PlayerEventType,
} from '../../../eventemitter';
import { PAGE_SIZE, TOOLBAR_HEIGHT } from '../constants';
import useData from './use_data';
import { createSinger } from '../../../utils';
import Singer from './singer';
import Guide from './guide';

const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const CardContainer = styled(Container)`
  ${flexCenter}

  flex-direction: column;
  gap: 20px;
`;
const MusicContainer = styled(Container)`
  padding-top: ${TOOLBAR_HEIGHT}px;

  overflow: auto;
`;
const paginationStyle: CSSProperties = {
  margin: '20px 0',
};

function Wrapper({ exploration }: { exploration: boolean }) {
  const navigate = useNavigate();
  const { data, reload, page } = useData();

  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return transitions((style, d) => {
    if (d.error) {
      return (
        <CardContainer style={style}>
          <ErrorCard errorMessage={d.error.message} retry={reload} />
        </CardContainer>
      );
    }
    if (d.loading) {
      return (
        <CardContainer style={style}>
          <Spinner />
        </CardContainer>
      );
    }
    if (!d.value!.total) {
      return (
        <CardContainer style={style}>
          <Empty description="未找到相关歌手" />
          <Button
            variant={Variant.PRIMARY}
            onClick={() =>
              playerEventemitter.emit(PlayerEventType.OPEN_EDIT_DIALOG, {
                title: '创建歌手',
                label: '名字',
                type: EditDialogType.INPUT,
                maxLength: NAME_MAX_LENGTH,
                onSubmit: async (name: string) =>
                  createSinger({
                    name,
                    callback: (id) => {
                      playerEventemitter.emit(
                        PlayerEventType.OPEN_SINGER_DRAWER,
                        { id },
                      );
                    },
                  }),
              })
            }
          >
            自己创建一个
          </Button>
        </CardContainer>
      );
    }
    return (
      <MusicContainer style={style}>
        <div>
          {d.value!.singerList.map((singer) => (
            <Singer key={singer.id} singer={singer} />
          ))}
        </div>
        {d.value!.total ? (
          <Pagination
            style={paginationStyle}
            page={page}
            pageSize={PAGE_SIZE}
            total={d.value!.total}
            onChange={(p) =>
              navigate({
                query: {
                  [Query.PAGE]: p,
                },
              })
            }
          />
        ) : null}
        {exploration ||
        page !== Math.ceil(d.value!.total / PAGE_SIZE) ? null : (
          <Guide />
        )}
      </MusicContainer>
    );
  });
}

export default Wrapper;
