import getCaptchaRequest from '@/server/get_captcha';
import { useState, useCallback, useEffect } from 'react';
import { CAPTCHA_TTL } from '#/constants';

type CaptchaData = AsyncReturnType<typeof getCaptchaRequest>;
const loadingCaptchaData = {
  error: null,
  loading: true,
  value: null,
} as const;

export default ({
  open,
  resetCaptchaCode,
}: {
  open: boolean;
  resetCaptchaCode: () => void;
}) => {
  const [lastGetCaptchaTimestamp, setLastGetCaptchaTimestamp] = useState(0);
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

  const getCaptcha = useCallback(async () => {
    resetCaptchaCode();
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
  }, [resetCaptchaCode]);

  useEffect(() => {
    if (open) {
      const interval = lastGetCaptchaTimestamp + CAPTCHA_TTL - Date.now();
      const timer = window.setTimeout(getCaptcha, interval < 0 ? 0 : interval);
      return () => window.clearTimeout(timer);
    }
  }, [getCaptcha, lastGetCaptchaTimestamp, open]);

  return {
    captchaData,
    getCaptcha,
  };
};
