import xss from 'xss';
import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import { HtmlHTMLAttributes } from 'react';
import { t } from '@/i18n';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const NICKNAME_CLASS_NAME = 'nickname';
const Style = styled.div`
  padding: 30px 20px;

  text-align: center;
  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};

  > .${NICKNAME_CLASS_NAME} {
    color: ${CSSVariable.COLOR_PRIMARY};
    cursor: pointer;
  }
`;

function CreateUser({
  userId,
  nickname,
  createTime,
  ...props
}: {
  userId: string;
  nickname: string;
  createTime: string;
} & HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <Style
      {...props}
      onClick={(event) => {
        if ((event.target as HTMLElement).className === NICKNAME_CLASS_NAME) {
          playerEventemitter.emit(PlayerEventType.OPEN_USER_DRAWER, {
            id: userId,
          });
        }
      }}
      dangerouslySetInnerHTML={{
        __html: xss(
          t(
            'someone_created_at',
            `
              <span class="${NICKNAME_CLASS_NAME}">
                ${nickname}
              </span>
            `,
            createTime,
          ),
          {
            whiteList: {
              span: ['class'],
            },
          },
        ),
      }}
    />
  );
}

export default CreateUser;
