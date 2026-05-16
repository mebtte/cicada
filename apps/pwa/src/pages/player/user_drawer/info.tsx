import { type Ref } from 'react';
import styled from 'styled-components';
import Avatar from '@/components/avatar';
import day from '@/utils/day';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import { t } from '@/i18n';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import { UserDetail } from './constants';

const AVATAR_SIZE = 156;
const Style = styled.section`
  padding: 28px 20px 20px;

  font-size: 0;
  background: linear-gradient(
    to bottom,
    rgb(232 255 218) 0%,
    rgb(255 248 220) 58%,
    #fff 100%
  );
  border-bottom: 2px solid rgb(229 229 229);
  user-select: none;

  > .avatar-stage {
    display: flex;
    justify-content: center;

    > .avatar {
      flex: 0 0 auto;
    }
  }

  > .identity {
    margin-top: 22px;

    text-align: center;

    > .nickname {
      margin: 0;

      font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
      font-size: 30px;
      font-weight: 800;
      line-height: 1.12;
      letter-spacing: 0;
      color: rgb(50 50 50);
      overflow-wrap: anywhere;
    }

    > .username {
      width: fit-content;
      max-width: 100%;
      margin: 10px auto 0;
      padding: 6px 12px 8px;

      font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
      font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
      font-weight: 800;
      line-height: 1;
      color: rgb(88 88 88);
      background: #fff;
      border: 2px solid rgb(229 229 229);
      border-radius: 12px;
      box-shadow: 0 3px 0 rgb(210 210 210);
      ${ellipsis}
    }

    > .join-time {
      width: fit-content;
      max-width: 100%;
      margin: 12px auto 0;

      font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
      font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
      font-weight: 700;
      line-height: 1.35;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
      overflow-wrap: anywhere;
      ${upperCaseFirstLetter}
    }

  }
`;

function Info({
  user,
  identityRef,
}: {
  user: UserDetail;
  identityRef?: Ref<HTMLElement>;
}) {
  return (
    <Style>
      <div className="avatar-stage">
        <Avatar className="avatar" src={user.avatar} size={AVATAR_SIZE} />
      </div>
      <section className="identity" ref={identityRef}>
        <h1 className="nickname">{user.nickname}</h1>
        <div className="username">@{user.username}</div>
        <div className="join-time">
          {t('join_at', day(user.joinTimestamp).format('YYYY-MM-DD'))}
        </div>
      </section>
    </Style>
  );
}

export default Info;
