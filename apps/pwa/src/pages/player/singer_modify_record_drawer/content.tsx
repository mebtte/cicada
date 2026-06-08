import styled from 'styled-components';
import Cover from '@/components/cover';
import getResizedImage from '@/server/asset/get_resized_image';
import useTitlebarArea from '@/utils/use_titlebar_area_rect';
import { Artist } from './constants';
import RecordList from './record_list';

const COVER_SIZE = 32;
const Style = styled.div`
  min-height: 100dvb;

  display: flex;
  flex-direction: column;

  > .artist {
    display: flex;
    align-items: center;
    gap: 10px;

    padding: 10px 20px;
  }
`;

function Content({ artist }: { artist: Artist }) {
  const { height } = useTitlebarArea();
  return (
    <Style style={{ paddingTop: height }}>
      <div className="artist">
        <Cover
          src={
            artist.avatar
              ? getResizedImage({
                  url: artist.avatar,
                  size: Math.ceil(COVER_SIZE * window.devicePixelRatio),
                })
              : ''
          }
          size={COVER_SIZE}
        />
        <div className="name">{artist.name}</div>
      </div>
      <RecordList artistId={artist.id} />
    </Style>
  );
}

export default Content;
