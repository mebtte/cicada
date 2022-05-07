import { useEffect, useState } from 'react';
import * as React from 'react';

import toast from '@/platform/toast';
import { ORIGIN } from '@/constants/regexp';
import setting from '@/setting';
import Label from '@/components/label';
import Input from '@/components/input';
import Button from '@/components/button';
import Dialog, { Title, Content, Action } from '@/components/dialog';
import eventemitter, { EventType } from './eventemitter';

const inputStyle = {
  width: '100%',
};

function SettingDialog() {
  const [open, setOpen] = useState(false);
  const onClose = () => setOpen(false);

  const [serverAddress, setServerAddress] = useState(
    setting.getServerAddress(),
  );
  const onServerAddressChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setServerAddress(event.target.value);

  const [loading, setLoading] = useState(false);
  const onConfirm = () => {
    if (!ORIGIN.test(serverAddress)) {
      return toast.error('服务器地址格式错误');
    }
    setLoading(true);
    setting.setServerAddress(serverAddress);
    setLoading(false);
    setOpen(false);
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
        <Label label="服务器地址">
          <Input
            value={serverAddress}
            onChange={onServerAddressChange}
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
}

export default SettingDialog;
