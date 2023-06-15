import styled from 'styled-components';
import Page from '../page';
import Toolbar from './toolbar';
import CollectionList from './collection_list';

const Style = styled(Page)`
  position: relative;

  display: flex;
  flex-direction: column;
`;

function PublicMusicbillCollection() {
  return (
    <Style>
      <CollectionList />
      <Toolbar />
    </Style>
  );
}

export default PublicMusicbillCollection;
