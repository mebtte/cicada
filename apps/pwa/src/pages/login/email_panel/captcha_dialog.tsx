import Dialog from '@mui/material/Dialog';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import LoadingButton from '@mui/lab/LoadingButton';
import TextField from '@mui/material/TextField';
import {
  ChangeEventHandler,
  ReactNode,
  useCallback,
  useEffect,
  useState,
  KeyboardEventHandler,
} from 'react';
import styled, { CSSProperties } from 'styled-components';
import { flexCenter } from '@/style/flexbox';
import ErrorCard from '@/components/error_card';
import { CAPTCHA_TTL } from '#/constants';
import getCaptchaRequest from '@/api/get_captcha';
import getLoginCodeRequest from '@/api/get_login_code';
import { ExceptionCode } from '#/constants/exception';
import notice from '@/platform/notice';
import sleep from '#/utils/sleep';
import ErrorWithCode from '@/utils/error_with_code';

type CaptchaData = AsyncReturnType<typeof getCaptchaRequest>;
const loadingCaptchaData = {
  error: null,
  loading: true,
  value: null,
} as const;
const Content = styled(Stack)`
  padding: 30px;

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
  email,
  updateEmail,
  toNext,
  onClose,
}: {
  email: string;
  onClose: () => void;
  updateEmail: (email: string) => void;
  toNext: () => void;
}) {
  const [captchaCode, setCaptchaCode] = useState('');
  const onCaptchaCodeChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setCaptchaCode(event.target.value);

  const [captchaData, setCaptchaData] = useState<
    | {
        error: null;
        loading: true;
        value: null;
      }
    | {
        error: Error;
        loading: false;
        value: null;
      }
    | {
        error: null;
        loading: false;
        value: CaptchaData;
      }
  >(loadingCaptchaData);
  const [lastGetCaptchaTimestamp, setLastGetCaptchaTimestamp] = useState(0);

  const [gettingLoginCode, setGettingLoginCode] = useState(false);

  const getCaptcha = useCallback(async () => {
    if (gettingLoginCode) {
      return;
    }

    setCaptchaCode('');
    setCaptchaData(loadingCaptchaData);
    try {
      const data = await getCaptchaRequest();
      setCaptchaData({
        error: null,
        loading: false,
        value: data,
      });
      setLastGetCaptchaTimestamp(Date.now());
    } catch (error) {
      console.error(error);
      setCaptchaData({
        error,
        loading: false,
        value: null,
      });
    }
  }, [gettingLoginCode]);

  useEffect(() => {
    const interval = lastGetCaptchaTimestamp + CAPTCHA_TTL - Date.now();
    const timer = window.setTimeout(getCaptcha, interval < 0 ? 0 : interval);
    return () => window.clearTimeout(timer);
  }, [getCaptcha, lastGetCaptchaTimestamp]);

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

      notice.success('登录验证码已发送到邮箱');
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
        <CircularProgress />
      </LoadingBox>
    );
  } else {
    content = (
      <Content spacing={3}>
        <div
          className="graph"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: captchaData.value.svg,
          }}
          onClick={getCaptcha}
        />
        <TextField
          label="验证码"
          value={captchaCode}
          onChange={onCaptchaCodeChange}
          onKeyDown={onKeyDown}
          disabled={gettingLoginCode}
          autoFocus
        />
        <LoadingButton
          variant="contained"
          disabled={!captchaCode.length}
          loading={gettingLoginCode}
          onClick={getLoginCode}
        >
          确定
        </LoadingButton>
      </Content>
    );
  }
  return (
    <Dialog open fullWidth maxWidth="xs" onClose={onClose} closeAfterTransition>
      {content}
    </Dialog>
  );
}

export default CaptchaDialog;
