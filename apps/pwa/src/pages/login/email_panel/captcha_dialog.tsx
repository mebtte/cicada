import {
  ChangeEventHandler,
  ReactNode,
  useState,
  KeyboardEventHandler,
  useCallback,
} from 'react';
import styled, { CSSProperties } from 'styled-components';
import { flexCenter } from '@/style/flexbox';
import ErrorCard from '@/components/error_card';
import getLoginCodeRequest from '@/server/get_login_code';
import { ExceptionCode } from '#/constants/exception';
import notice from '@/utils/notice';
import sleep from '#/utils/sleep';
import ErrorWithCode from '@/utils/error_with_code';
import Dialog, { Container, Content } from '@/components/dialog';
import Spinner from '@/components/spinner';
import Input from '@/components/input';
import Button, { Variant } from '@/components/button';
import useCaptchaData from './use_captcha_data';

const StyledContent = styled(Content)`
  display: flex;
  flex-direction: column;
  gap: 10px;

  > .graph {
    cursor: pointer;

    > svg {
      width: 100%;
      height: auto;
    }
  }
`;
const LoadingBox = styled.div`
  padding: 30px;

  ${flexCenter}
`;
const errorCardStyle: CSSProperties = {
  padding: 30,
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
  const resetCaptchaCode = useCallback(() => setCaptchaCode(''), []);

  const [gettingLoginCode, setGettingLoginCode] = useState(false);
  const { captchaData, getCaptcha } = useCaptchaData({
    open,
    resetCaptchaCode,
  });

  const toNextWrapper = () => {
    updateEmail(email);
    onClose();
    sleep(0).then(() => toNext());
  };

  const getLoginCode = async () => {
    if (!captchaCode.length) {
      return notice.error('请输入验证码');
    }

    setGettingLoginCode(true);
    try {
      await getLoginCodeRequest({
        email,
        captchaId: captchaData.value!.id,
        captchaValue: captchaCode,
      });
      toNextWrapper();

      notice.info('登录验证码已发送到邮箱');
      sleep(1000).then(() =>
        notice.info('登录验证码邮件可能会被归类到垃圾邮件'),
      );
    } catch (error) {
      const { code, message } = error as ErrorWithCode<ExceptionCode>;
      switch (code) {
        case ExceptionCode.CAPTCHA_ERROR: {
          getCaptcha();
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

  let content: ReactNode = null;
  if (captchaData.error) {
    content = (
      <ErrorCard
        errorMessage={captchaData.error.message}
        retry={getCaptcha}
        style={errorCardStyle}
      />
    );
  } else if (captchaData.loading) {
    content = (
      <LoadingBox>
        <Spinner />
      </LoadingBox>
    );
  } else {
    content = (
      <Container>
        <StyledContent>
          <div
            className="graph"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: captchaData.value.svg,
            }}
            onClick={getCaptcha}
          />
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
    );
  }
  return (
    <Dialog open={open} onClose={onClose}>
      {content}
    </Dialog>
  );
}

export default CaptchaDialog;
