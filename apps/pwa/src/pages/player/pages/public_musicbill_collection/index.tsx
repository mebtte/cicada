import styled from 'styled-components';
import Page from '../page';
import CollectionList from './collection_list';

const Style = styled(Page)`
  position: relative;

  display: flex;
  flex-direction: column;

  background:
    linear-gradient(180deg, rgb(247 253 248) 0, rgb(248 249 250) 280px),
    rgb(248 249 250);
`;

function PublicMusicbillCollection() {
  return (
    <Style>
      <CollectionList />
    </Style>
  );
}

export default PublicMusicbillCollection;
