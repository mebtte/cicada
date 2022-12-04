import styled from 'styled-components';
import Cover from '@/components/cover';
import day from '#/utils/day';
import { CSSVariable } from '@/global_style';
import { Musicbill } from '../../constants';
import { INFO_HEIGHT } from './constants';
import Operation from './operation';

const GAP = 10;
const Style = styled.div`
  height: ${INFO_HEIGHT}px;
  padding: 0 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  > .cover-box {
    position: relative;

    > .cover {
      display: block;
    }

    > .public {
      font-size: 12px;
      color: #fff;
      background-color: ${CSSVariable.COLOR_PRIMARY};
      padding: 0 5px;

      position: absolute;
      top: 0;
      left: 0;
    }
  }

  > .info {
    flex: 1;
    min-width: 0;
    height: ${INFO_HEIGHT - GAP * 2}px;

    display: flex;
    flex-direction: column;
    justify-content: space-between;

    > .name {
      font-size: 14px;
      font-weight: bold;
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    }

    > .create-time {
      font-size: 12px;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    }
  }
`;

function Info({ musicbill }: { musicbill: Musicbill }) {
  return (
    <Style>
      <div
        className="cover-box"
        style={{
          outline: musicbill.public
            ? `2px solid ${CSSVariable.COLOR_PRIMARY}`
            : 'none',
        }}
      >
        <Cover
          className="cover"
          src={musicbill.cover}
          size={INFO_HEIGHT - GAP * 2}
        />
        {musicbill.public ? <div className="public">公开</div> : null}
      </div>
      <div className="info">
        <div className="name">{musicbill.name}</div>
        <div className="create-time">
          创建于 {day(musicbill.createTimestamp).format('YYYY-MM-DD HH:mm')}
        </div>
        <Operation musicbill={musicbill} />
      </div>
    </Style>
  );
}

export default Info;
