import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import Page from '../page';
import MusicContent from '../../music_drawer/content';

const Style = styled(Page)`
  z-index: 1;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

function Wrapper() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return null;
  }
  return (
    <Style>
      <MusicContent id={id} floatingControllerOffset />
    </Style>
  );
}

export default Wrapper;
