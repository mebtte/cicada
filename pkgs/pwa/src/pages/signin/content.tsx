import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

import IconButton, { Name as IconButtonName } from '@/components/icon_button';
import Icon, { Name as IconName } from '@/components/icon';
import { EMAIL } from '@/constants/regexp';
import {
  TOKEN,
  TOKEN_EXPIRED_AT,
  LAST_SIGNIN_EMAIL,
} from '@/constants/storage_key';
import toast from '@/platform/toast';
import logger from '@/platform/logger';
import signin from '@/server/signin';
import getUser from '@/server/get_user';
import store from '@/store';
import { setUser } from '@/store/user';
import dialog from '@/platform/dialog';
import Input from '@/components/input';
import Button, { Type } from '@/components/button';
import Logo from './logo';
import VerifyCodeButton from './verify_code_button';
import eventemitter, { EventType } from './eventemitter';

const ICON_SIZE = 18;
const Style = styled.div`
  position: relative;
  border-radius: 4px;
  backdrop-filter: blur(5px);
  background-color: rgba(255, 255, 255, 0.8);
  width: 300px;
  padding: 40px;
  > .setting {
    position: absolute;
    top: 10px;
    right: 10px;
  }
  > .input-box {
    display: flex;
    align-items: center;
    margin: 20px 0;
    > .input-wrapper {
      flex: 1;
      min-width: 0;
      position: relative;
      > .input {
        padding-right: ${ICON_SIZE + 10}px;
      }
      > .icon {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translate(0, -50%);
        color: rgba(0, 0, 0, 0.3);
      }
    }
  }
`;
const inputStyle = {
  width: '100%',
  display: 'block',
};
const openSettingDialog = () =>
  eventemitter.emit(EventType.OPEN_SETTING_DIALOG);

const Content = () => {
  const [email, setEmail] = useState(
    localStorage.getItem(LAST_SIGNIN_EMAIL) || '',
  );
  const onEmailChange = useCallback(
    (event) => setEmail(event.target.value),
    [],
  );
  const [verifyCode, setVerifyCode] = useState('');
  const onVerifyCodeChange = useCallback(
    (event) => setVerifyCode(event.target.value),
    [],
  );
  const [loading, setLoading] = useState(false);
  const onSignin = async () => {
    if (!EMAIL.test(email)) {
      return toast.error('邮箱格式错误');
    }
    setLoading(true);
    try {
      const { token, tokenExpiredAt } = await signin({ email, verifyCode });
      localStorage.setItem(TOKEN_EXPIRED_AT, tokenExpiredAt);
      localStorage.setItem(TOKEN, token);
      localStorage.setItem(LAST_SIGNIN_EMAIL, email);
      const user = await getUser();
      // @ts-expect-error
      setTimeout(() => store.dispatch(setUser(user)), 0);
    } catch (error) {
      logger.error(error, { description: '登录失败', report: true });
      dialog.alert({
        title: '登录失败',
        content: error.message,
      });
    }
    setLoading(false);
  };

  return (
    <Style>
      <IconButton
        className="setting"
        name={IconButtonName.SETTING_OUTLINE}
        onClick={openSettingDialog}
      />
      <Logo />
      <div className="input-box">
        <div className="input-wrapper">
          <Input
            style={inputStyle}
            className="input"
            value={email}
            onChange={onEmailChange}
            placeholder="邮箱"
            type="text"
          />
          <Icon className="icon" name={IconName.EMAIL_FILL} size={ICON_SIZE} />
        </div>
      </div>
      <div className="input-box">
        <div className="input-wrapper">
          <Input
            style={inputStyle}
            className="input"
            value={verifyCode}
            onChange={onVerifyCodeChange}
            placeholder="验证码"
            type="text"
          />
          <Icon className="icon" name={IconName.SHIELD_FILL} size={ICON_SIZE} />
        </div>
        <VerifyCodeButton email={email} />
      </div>
      <Button
        label="登录"
        block
        loading={loading}
        disabled={!email || !verifyCode}
        onClick={onSignin}
        type={Type.PRIMARY}
        size={32}
      />
    </Style>
  );
};

export default Content;
