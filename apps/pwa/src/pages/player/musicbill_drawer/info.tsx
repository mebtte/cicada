import styled from 'styled-components';
import Cover from '#/components/cover';
import day from '#/utils/day';
import { CSSVariable } from '#/global_style';
import ellipsis from '#/style/ellipsis';
import { Musicbill } from './constants';

const Style = styled.div`
  position: relative;

  > .info {
    position: absolute;
    bottom: 0;
    left: 0;
    max-width: 90%;

    padding: 10px 20px;
    background-color: rgb(255 255 255 / 0.75);

    > .nickname {
      font-size: 18px;
      font-weight: bold;
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
      ${ellipsis}
    }

    > .join-time {
      font-size: 12px;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    }
  }
`;

function Info({ musicbill }: { musicbill: Musicbill }) {
  return (
    <Style>
      <Cover src={musicbill.cover} size="100%" />
      <div className="info">
        <div className="nickname">{musicbill.name}</div>
        <div className="join-time">
          {day(musicbill.createTimestamp).format('YYYY-MM-DD')} 加入
        </div>
      </div>
    </Style>
  );
}

export default Info;
