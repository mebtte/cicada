import styled from 'styled-components';
import Spinner from '#/components/spinner';
import { flexCenter } from '#/style/flexbox';
import Empty from '@/components/empty';
import Pagination from '#/components/pagination';
import { CSSProperties, useCallback } from 'react';
import ErrorCard from '@/components/error_card';
import useNavigate from '#/utils/use_navigate';
import { Query } from '@/constants';
import { animated, useTransition } from 'react-spring';
import absoluteFullSize from '#/style/absolute_full_size';
import { CSSVariable } from '#/global_style';
import Button, { Variant } from '#/components/button';
import useMusicList from './use_music_list';
import { PAGE_SIZE, TOOLBAR_HEIGHT } from '../constants';
import Music from './music';
import Row from './row';

const Style = styled.div`
  flex: 1;
  min-height: 0;

  position: relative;
`;
const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const CardContainer = styled(Container)`
  ${flexCenter}

  flex-direction: column;
  gap: 20px;
`;
const MusicListContainer = styled(Container)`
  padding-bottom: ${TOOLBAR_HEIGHT}px;

  overflow: auto;
`;
const paginationStyle: CSSProperties = {
  margin: '10px 0',
};
const headStyle: CSSProperties = {
  zIndex: 1,
  position: 'sticky',
  height: 30,
  top: 0,
  backdropFilter: 'blur(5px)',
};
const RowHead = styled.div`
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
`;

function MusicList() {
  const navigate = useNavigate();
  const onPageChange = useCallback(
    (p: number) =>
      navigate({
        query: {
          [Query.PAGE]: p,
        },
      }),
    [navigate],
  );

  const { page, data, reload } = useMusicList();

  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Style>
      {transitions((style, d) => {
        const { error, loading, value } = d;
        if (error) {
          return (
            <CardContainer style={style}>
              <ErrorCard errorMessage={error.message} retry={reload} />
            </CardContainer>
          );
        }
        if (loading) {
          return (
            <CardContainer style={style}>
              <Spinner />
            </CardContainer>
          );
        }

        if (!value!.total && !value!.musicList.length) {
          return (
            <CardContainer style={style}>
              <Empty description="暂无相关音乐" />
              <Button
                variant={Variant.PRIMARY}
                onClick={() =>
                  navigate({
                    query: {
                      [Query.CREATE_MUSIC_DIALOG_OPEN]: 1,
                    },
                  })
                }
              >
                创建音乐
              </Button>
            </CardContainer>
          );
        }

        return (
          <MusicListContainer style={style}>
            <Row
              style={headStyle}
              one={null}
              two={<RowHead>名字/别名</RowHead>}
              three={<RowHead>歌手</RowHead>}
              four={<RowHead>热度</RowHead>}
              five={<RowHead>创建时间</RowHead>}
              six={<RowHead>操作</RowHead>}
            />
            <div className="list">
              {value!.musicList.map((music) => (
                <Music key={music.id} music={music} />
              ))}
            </div>
            {value!.total ? (
              <Pagination
                style={paginationStyle}
                total={value!.total}
                pageSize={PAGE_SIZE}
                page={page}
                onChange={onPageChange}
              />
            ) : null}
          </MusicListContainer>
        );
      })}
    </Style>
  );
}

export default MusicList;
