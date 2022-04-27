import React, { useState, useCallback, useEffect, useRef } from 'react';

import { EMAIL } from '@/constants/regexp';
import toast from '@/platform/toast';
import logger from '@/platform/logger';
import getSigninVerifyCode from '@/server/get_signin_verify_code';
import formatSecond from '@/utils/format_second';
import dialog from '@/platform/dialog';
import Button, { Type } from '@/components/button';

const GET_VERIFY_CODE_INTERVAL = 1000 * 60;
const STYLE = {
  marginLeft: 10,
};

const VerifyCodeButton = ({ email }: { email: string }) => {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const [timeString, setTimeString] = useState('');
  const [endTime, setEndTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const getVerifyCode = useCallback(async () => {
    if (!EMAIL.test(email)) {
      return toast.error('邮箱格式错误');
    }
    setLoading(true);
    try {
      await getSigninVerifyCode(email);
      setEndTime(new Date(Date.now() + GET_VERIFY_CODE_INTERVAL).getTime());
      setTimeString(formatSecond(GET_VERIFY_CODE_INTERVAL / 1000));
    } catch (error) {
      logger.error(error, { description: '获取验证码失败', report: true });
      dialog.alert({
        title: '获取验证码失败',
        content: error.message,
      });
    }
    setLoading(false);
  }, [email]);

  useEffect(() => {
    if (endTime) {
      timer.current = setInterval(() => {
        const now = Date.now();
        if (now > endTime) {
          setTimeString('');
          clearInterval(timer.current);
        } else {
          setTimeString(formatSecond((endTime - now) / 1000));
        }
      }, 900);
      return () => clearInterval(timer.current);
    }
  }, [endTime]);

  return (
    <Button
      label={timeString || '获取验证码'}
      loading={loading}
      disabled={!email || loading || !!timeString}
      onClick={getVerifyCode}
      style={STYLE}
      type={Type.PRIMARY}
      size={32}
    />
  );
};

export default VerifyCodeButton;
