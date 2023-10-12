import styled from 'styled-components';
import Cover, { Shape } from '@/components/cover';
import day from '#/utils/day';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import { t } from '@/i18n';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import { UserDetail } from './constants';

const Style = styled.div`
  position: relative;

  font-size: 0;

  > .info {
    position: absolute;
    bottom: 0;
    left: 0;
    max-width: 90%;

    border-top-right-radius: ${CSSVariable.BORDER_RADIUS_NORMAL};
    padding: 10px 20px;
    background-color: rgb(255 255 255 / 0.75);

    > .nickname {
      font-size: 24px;
      font-weight: bold;
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
      ${ellipsis}
    }

    > .username {
      margin: 5px 0;

      font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    }

    > .join-time {
      font-size: ${CSSVariable.TEXT_SIZE_SMALL};
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};

      ${upperCaseFirstLetter}
    }
  }
`;

function Info({ user }: { user: UserDetail }) {
  return (
    <Style>
      <Cover src={user.avatar} size="100%" shape={Shape.SQUARE} />
      <div className="info">
        <div className="nickname">{user.nickname}</div>
        <div className="username">@{user.username}</div>
        <div className="join-time">
          {t('join_at', day(user.joinTimestamp).format('YYYY-MM-DD'))}
        </div>
      </div>
    </Style>
  );
}

export default Info;
