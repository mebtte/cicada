import {
  ChangeEventHandler,
  useState,
  KeyboardEventHandler,
  useEffect,
} from 'react';
import styled, { CSSProperties } from 'styled-components';
import getLoginCodeRequest from '@/server/base/get_login_code';
import { ExceptionCode } from '#/constants/exception';
import notice from '@/utils/notice';
import sleep from '#/utils/sleep';
import ErrorWithCode from '@/utils/error_with_code';
import Dialog, { Container, Content } from '@/components/dialog';
import Input from '@/components/input';
import Button, { Variant } from '@/components/button';
import Captcha, { useCaptcha } from '@/components/captcha';

const StyledContent = styled(Content)`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
const maskProps: { style: CSSProperties } = {
  style: {
    // @ts-expect-error
    WebkitAppRegion: 'no-drag',
  },
};

function CaptchaDialog({
  open,
  email,
  updateEmail,
  toNext,
  onClose,
}: {
  open: boolean;
  email: string;
  onClose: () => void;
  updateEmail: (email: string) => void;
  toNext: () => void;
}) {
  const [captchaCode, setCaptchaCode] = useState('');
  const onCaptchaCodeChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setCaptchaCode(event.target.value);

  const [gettingLoginCode, setGettingLoginCode] = useState(false);
  const { captchaData, reload: reloadCaptchaData } = useCaptcha();

  useEffect(() => {
    setCaptchaCode('');
  }, [captchaData]);

  const toNextWrapper = () => {
    updateEmail(email);
    onClose();
    sleep(0).then(() => toNext());
  };

  const getLoginCode = async () => {
    if (!captchaData.data) {
      return notice.error('请等待验证码加载完毕');
    }

    if (!captchaCode.length) {
      return notice.error('请输入验证码');
    }

    setGettingLoginCode(true);
    try {
      await getLoginCodeRequest({
        email,
        captchaId: captchaData.data.id,
        captchaValue: captchaCode,
      });
      toNextWrapper();

      notice.info('登录验证码已发送到邮箱');
    } catch (error) {
      const { code, message } = error as ErrorWithCode<ExceptionCode>;
      switch (code) {
        case ExceptionCode.USER_NOT_EXIST:
        case ExceptionCode.CAPTCHA_ERROR: {
          reloadCaptchaData();
          break;
        }
        case ExceptionCode.HAS_LOGIN_CODE_ALREADY: {
          toNextWrapper();
          break;
        }
      }
      notice.error(message);
    }
    setGettingLoginCode(false);
  };

  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter') {
      getLoginCode();
    }
  };

  return (
    <Dialog open={open} maskProps={maskProps} onClose={onClose}>
      <Container>
        <StyledContent>
          <Captcha captchaData={captchaData} reload={reloadCaptchaData} />
          <Input
            label="验证码"
            inputProps={{
              value: captchaCode,
              autoFocus: true,
              onChange: onCaptchaCodeChange,
              onKeyDown,
            }}
            disabled={gettingLoginCode}
          />
          <Button
            variant={Variant.PRIMARY}
            disabled={!captchaCode.length}
            loading={gettingLoginCode}
            onClick={getLoginCode}
          >
            确定
          </Button>
        </StyledContent>
      </Container>
    </Dialog>
  );
}

export default CaptchaDialog;
