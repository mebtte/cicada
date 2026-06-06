import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import capitalize from '@/style/capitalize';
import { SingerDetail } from '../constants';
import Singer from './singer';
import { PAGE_HORIZONTAL_PADDING } from '../../pages/page';

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

function SingerList({
  label,
  singerList,
}: {
  label: string;
  singerList: SingerDetail[];
}) {
  if (!singerList.length) {
    return null;
  }

  return (
    <Style>
      <div className="label">{label}</div>
      <div className="list">
        {singerList.map((singer) => (
          <Singer key={singer.id} singer={singer} />
        ))}
      </div>
    </Style>
  );
}

export default SingerList;
