import styled from 'styled-components';
import { flexCenter } from '@/style/flexbox';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import day from '#/utils/day';
import { AllowUpdateKey } from '#/constants/singer';
import { CSSVariable } from '@/global_style';
import Empty from '@/components/empty';
import useModifyRecordList from './use_modify_record_list';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const KEY_MAP_LABEL: Record<AllowUpdateKey, string> = {
  [AllowUpdateKey.AVATAR]: '头像',
  [AllowUpdateKey.NAME]: '名字',
  [AllowUpdateKey.ALIASES]: '别名',
};
const Root = styled.div`
  flex: 1;
  min-height: 0;
`;
const CardContainer = styled(Root)`
  ${flexCenter}
`;
const Style = styled(Root)`
  > .record {
    --border-width: 2px;

    margin: 0 20px;
    padding: 10px 0 10px 20px;

    position: relative;

    border-left: var(--border-width) solid
      ${CSSVariable.BACKGROUND_COLOR_LEVEL_THREE};

    > .time {
      font-size: 12px;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    }

    > .description {
      font-size: 14px;
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
      line-height: 2;

      > .user {
        color: ${CSSVariable.COLOR_PRIMARY};
        cursor: pointer;
      }

      > .key {
        text-decoration: underline;
      }
    }

    &::after {
      content: '';

      --size: 8px;
      position: absolute;
      top: calc(50% - var(--size) / 2);
      left: calc(var(--size) / 2 * -1 - var(--border-width) / 2);
      width: var(--size);
      height: var(--size);
      box-sizing: border-box;

      background-color: #fff;
      border-radius: 50%;
      border: 1px solid ${CSSVariable.COLOR_PRIMARY};
    }
  }
`;

function RecordList({ singerId }: { singerId: string }) {
  const { data, reload } = useModifyRecordList({ singerId });

  if (data.error) {
    return (
      <CardContainer>
        <ErrorCard errorMessage={data.error.message} retry={reload} />
      </CardContainer>
    );
  }
  if (data.loading) {
    return (
      <CardContainer>
        <Spinner />
      </CardContainer>
    );
  }
  if (!data.value.length) {
    return (
      <CardContainer>
        <Empty description="暂无修改记录" />
      </CardContainer>
    );
  }
  return (
    <Style>
      {data.value.map((record) => (
        <div key={record.id} className="record">
          <div className="time">
            {day(record.modifyTimestamp).format('YYYY-MM-DD HH:mm')}
          </div>
          <div className="description">
            <span
              className="user"
              onClick={() =>
                playerEventemitter.emit(PlayerEventType.OPEN_USER_DRAWER, {
                  id: record.modifyUserId,
                })
              }
            >
              {record.modifyUserNickname}
            </span>
            &nbsp;修改了&nbsp;
            <span className="key">
              {KEY_MAP_LABEL[record.key] || record.key}
            </span>
          </div>
        </div>
      ))}
    </Style>
  );
}

export default RecordList;
