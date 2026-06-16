import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import capitalize from '@/style/capitalize';
import { ArtistDetail } from '../constants';
import Performer from './performer';
import { PAGE_HORIZONTAL_PADDING } from '../../../page_layout';

const Style = styled.div`
  margin: 20px ${PAGE_HORIZONTAL_PADDING};

  > .label {
    margin-bottom: 10px;

    color: rgb(75 75 75);
    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 800;
    line-height: 1.2;
    ${capitalize}
  }

  > .list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
`;

function ArtistList({
  label,
  artistList,
}: {
  label: string;
  artistList: ArtistDetail[];
}) {
  if (!artistList.length) {
    return null;
  }

  return (
    <Style>
      <div className="label">{label}</div>
      <div className="list">
        {artistList.map((performer) => (
          <Performer key={performer.id} performer={performer} />
        ))}
      </div>
    </Style>
  );
}

export default ArtistList;
