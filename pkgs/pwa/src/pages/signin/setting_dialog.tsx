import React, { useEffect, useState } from 'react';

import { SERVER_ORIGIN } from '@/constants/storage_key';
import toast from '@/platform/toast';
import { ORIGIN } from '@/constants/regexp';
import config from '@/config';
import Label from '@/components/label';
import Input from '@/components/input';
import Button from '@/components/button';
import Dialog, { Title, Content, Action } from '@/components/dialog';
import eventemitter, { EventType } from './eventemitter';

const inputStyle = {
  width: '100%',
};

const SettingDialog = () => {
  const [open, setOpen] = useState(false);
  const onClose = () => setOpen(false);

  const [serverOrigin, setServerOrigin] = useState(config.serverOrigin);
  const onServerOriginChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setServerOrigin(event.target.value);

  const [loading, setLoading] = useState(false);
  const onConfirm = () => {
    if (!ORIGIN.test(serverOrigin)) {
      return toast.error('Server origin 格式错误');
    }
    setLoading(true);
    localStorage.setItem(SERVER_ORIGIN, serverOrigin);
    setTimeout(() => window.location.reload(), 0);
  };

  useEffect(() => {
    const openListener = () => {
      setOpen(true);
    };
    eventemitter.on(EventType.OPEN_SETTING_DIALOG, openListener);
    return () =>
      void eventemitter.off(EventType.OPEN_SETTING_DIALOG, openListener);
  }, []);

  return (
    <Dialog open={open}>
      <Title>设置</Title>
      <Content>
        <Label label="Server Origin">
          <Input
            value={serverOrigin}
            onChange={onServerOriginChange}
            style={inputStyle}
            disabled={loading}
          />
        </Label>
      </Content>
      <Action>
        <Button label="取消" onClick={onClose} disabled={loading} />
        <Button label="确定" onClick={onConfirm} loading={loading} />
      </Action>
    </Dialog>
  );
};

export default SettingDialog;
