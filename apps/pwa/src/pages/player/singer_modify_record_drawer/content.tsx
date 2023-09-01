import styled from 'styled-components';
import Cover from '@/components/cover';
import getResizedImage from '@/server/asset/get_resized_image';
import useTitlebarArea from '@/utils/use_titlebar_area_rect';
import { Singer } from './constants';
import RecordList from './record_list';

const COVER_SIZE = 32;
const Style = styled.div`
  min-height: 100dvb;

  display: flex;
  flex-direction: column;

  > .singer {
    display: flex;
    align-items: center;
    gap: 10px;

    padding: 10px 20px;
  }
`;

function Content({ singer }: { singer: Singer }) {
  const { height } = useTitlebarArea();
  return (
    <Style style={{ paddingTop: height }}>
      <div className="singer">
        <Cover
          src={
            singer.avatar
              ? getResizedImage({
                  url: singer.avatar,
                  size: COVER_SIZE * 2,
                })
              : ''
          }
          size={COVER_SIZE}
        />
        <div className="name">{singer.name}</div>
      </div>
      <RecordList singerId={singer.id} />
    </Style>
  );
}

export default Content;
