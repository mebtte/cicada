import styled from 'styled-components';
import { SingerDetail } from '../constants';
import Singer from './singer';

const Style = styled.div`
  margin: 0 0 10px 0;
`;

function SingerList({ singerList }: { singerList: SingerDetail[] }) {
  return (
    <Style>
      {singerList.map((singer) => (
        <Singer key={singer.id} singer={singer} />
      ))}
    </Style>
  );
}

export default SingerList;
