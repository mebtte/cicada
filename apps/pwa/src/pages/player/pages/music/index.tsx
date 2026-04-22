import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import Page from '../page';
import { HEADER_HEIGHT } from '../../constants';
import MusicContent from '../../music_drawer/content';

const Style = styled(Page)`
  position: absolute;
  top: ${HEADER_HEIGHT}px;
  left: 0;
  width: 100%;
  height: calc(100% - ${HEADER_HEIGHT}px);
`;

function Wrapper() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return null;
  }
  return (
    <Style>
      <MusicContent id={id} />
    </Style>
  );
}

export default Wrapper;
