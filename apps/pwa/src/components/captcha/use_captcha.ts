import { useCallback, useEffect, useState } from 'react';
import { CAPTCHA_TTL } from '#/constants';
import logger from '@/utils/logger';
import getCaptcha from '@/server/base/get_captcha';
import { CaptchaData } from './constants';

const loadingCaptchaData: CaptchaData = {
  error: null,
  loading: true,
  data: null,
};

export default () => {
  const [captchaData, setCaptchaData] =
    useState<CaptchaData>(loadingCaptchaData);
  const getCaptchaData = useCallback(async () => {
    setCaptchaData(loadingCaptchaData);
    try {
      const captcha = await getCaptcha();
      setCaptchaData({
        error: null,
        loading: false,
        data: captcha,
      });
    } catch (error) {
      logger.error(error, '获取图形验证码失败');
      setCaptchaData({
        error,
        loading: false,
        data: null,
      });
    }
  }, []);

  useEffect(() => {
    getCaptchaData();
  }, [getCaptchaData]);

  useEffect(() => {
    if (captchaData.data) {
      const timer = window.setTimeout(getCaptchaData, CAPTCHA_TTL - 10 * 1000);
      return () => window.clearTimeout(timer);
    }
  }, [captchaData, getCaptchaData]);

  return { captchaData, reload: getCaptchaData };
};
