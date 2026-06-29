import absoluteFullSize from '@/style/absolute_full_size';
import { flexCenter } from '@/style/flexbox';
import { animated, useTransition } from '@react-spring/web';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import Empty from '@/components/empty';
import Pagination from '@/components/pagination';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import { CSSProperties } from 'react';
import getResizedImage from '@/server/asset/get_resized_image';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import { PAGE_SIZE } from '../constants';
import { FLOATING_CONTROLLER_SCROLL_SPACE } from '../../../constants';
import useData from './use_data';
import Artist from './artist';
import { PAGE_HORIZONTAL_PADDING } from '../../page';

const AVATAR_IMAGE_SIZE = 72;
const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const CardContainer = styled(Container)`
  ${flexCenter}

  flex-direction: column;
  gap: 20px;
`;
const ArtistContainer = styled(Container)`
  overflow: auto;
  ${autoScrollbar}

  > .list {
    width: 100%;
    padding: calc(var(--search-toolbar-height) + 12px)
      ${PAGE_HORIZONTAL_PADDING} 0;

    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &::after {
    content: '';
    display: block;
    height: ${FLOATING_CONTROLLER_SCROLL_SPACE};
  }
`;
const paginationStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  margin: '20px 0',
};

function Wrapper() {
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
          <Empty description={t('no_suitable_artist')} />
        </CardContainer>
      );
    }
    return (
      <ArtistContainer style={style}>
        <div className="list">
          {d.value!.artistList.map((artist) => (
            <Artist
              key={artist.id}
              artistId={artist.id}
              artistName={artist.name}
              artistAvatar={getResizedImage({
                url: artist.avatar,
                size: Math.ceil(AVATAR_IMAGE_SIZE * window.devicePixelRatio),
              })}
              artistAvatarThumbnail={artist.avatarThumbnail}
              artistAliases={artist.aliases}
              musicCount={artist.musicCount}
            />
          ))}
        </div>
        {d.value!.total ? (
          <Pagination
            style={paginationStyle}
            page={page}
            count={Math.ceil(d.value!.total / PAGE_SIZE)}
            onChange={(p) =>
              navigate({
                query: {
                  [Query.PAGE]: p,
                },
              })
            }
          />
        ) : null}
      </ArtistContainer>
    );
  });
}

export default Wrapper;
