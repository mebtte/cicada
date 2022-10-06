import Dialog, { Title, Content, Action } from '#/components/dialog';
import Button, { Variant } from '#/components/button';
import Input from '#/components/input';
import setting from '@/global_states/setting';
import { useState } from 'react';
import useEvent from '#/utils/use_event';
import { URL } from '#/constants/regexp';
import notice from '#/utils/notice';

function SettingDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [serverAddress, setServerAddress] = useState(
    () => setting.get().serverAddress,
  );
  const onSave = useEvent(() => {
    if (!URL.test(serverAddress)) {
      return notice.error('服务器地址不是一个合法的 URL');
    }
    setting.set({ serverAddress });

    return onClose();
  });

  return (
    <Dialog open={open}>
      <Title>设置</Title>
      <Content>
        <Input
          label="服务器地址"
          inputProps={{
            value: serverAddress,
            onChange: (event) => setServerAddress(event.target.value),
          }}
        />
      </Content>
      <Action>
        <Button onClick={onClose}>取消</Button>
        <Button variant={Variant.PRIMARY} onClick={onSave}>
          确定
        </Button>
      </Action>
    </Dialog>
  );
}

export default SettingDialog;
