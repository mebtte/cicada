import styled from 'styled-components';
import Page from '../page';
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
    </Style>
  );
}

export default PublicMusicbillCollection;
