import styled from 'styled-components';
import Pagination from '@/components/pagination';
import { HEADER_HEIGHT } from '../../constants';
import Page from '../page';
import useData from './use_data';

const Style = styled(Page)`
  padding-top: ${HEADER_HEIGHT}px;
`;

function PlayRecord() {
  const { data, page } = useData();
  return (
    <Style>
      <Pagination page={page} />
    </Style>
  );
}

export default PlayRecord;
