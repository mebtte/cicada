import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useEffect,
  useState,
} from 'react';
import { EMAIL } from '#/constants/regexp';
import styled from 'styled-components';
import notice from '@/utils/notice';
import Input from '@/components/input';
import logger from '@/utils/logger';
import storage, { Key } from '@/storage';
import Button, { Variant } from '@/components/button';
import useEvent from '@/utils/use_event';
import dialog from '@/utils/dialog';
import getLoginCode from '@/server/base/get_login_code';
import ErrorWithCode from '@/utils/error_with_code';
import { ExceptionCode } from '#/constants/exception';
import Logo from '../logo';
import Paper from '../paper';
import SettingDialog from './setting_dialog';

const Style = styled(Paper)`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

function EmailPanel({ toNext }: { toNext: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const onEmailChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setEmail(event.target.value);

  const [settingDialogOpen, setSettingDialogOpen] = useState(false);
  const openSettingDialog = useEvent(() => setSettingDialogOpen(true));
  const closeSettingDialog = useEvent(() => setSettingDialogOpen(false));

  const onGetLoginCode = () => {
    if (!EMAIL.test(email)) {
      return notice.error('请输入合法的邮箱');
    }
    return dialog.captcha({
      confirmText: '获取登录验证码',
      confirmVariant: Variant.PRIMARY,
      onConfirm: async ({ captchaId, captchaValue }) => {
        try {
          await getLoginCode({
            email,
            captchaId,
            captchaValue,
          });
          notice.info('登录验证码已发送到邮箱');
          toNext(email);
        } catch (error) {
          logger.error(error, '获取登录验证码失败');

          const { code, message } = error as ErrorWithCode<ExceptionCode>;
          notice.error(message);
          switch (code) {
            case ExceptionCode.HAS_LOGIN_CODE_ALREADY: {
              toNext(email);
              break;
            }
          }

          return false;
        }
      },
    });
  };

  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter') {
      onGetLoginCode();
    }
  };

  useEffect(() => {
    storage
      .getItem(Key.LAST_LOGIN_EMAIL)
      .then((lastLoginEmail) => {
        if (lastLoginEmail) {
          setEmail(lastLoginEmail);
        }
      })
      .catch((error) => logger.error(error, '查找上次登录邮箱失败'));
  }, []);

  return (
    <>
      <Style>
        <Logo />
        <Input
          label="邮箱"
          inputProps={{
            type: 'email',
            value: email,
            onChange: onEmailChange,
            onKeyDown,
            autoFocus: true,
          }}
        />
        <Button
          variant={Variant.PRIMARY}
          onClick={onGetLoginCode}
          disabled={!email.length}
        >
          继续
        </Button>
        <Button onClick={openSettingDialog}>设置</Button>
      </Style>
      <SettingDialog open={settingDialogOpen} onClose={closeSettingDialog} />
    </>
  );
}

export default EmailPanel;
