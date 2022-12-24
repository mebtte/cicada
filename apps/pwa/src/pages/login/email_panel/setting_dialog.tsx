import Dialog, { Container, Title, Content, Action } from '@/components/dialog';
import Button, { Variant } from '@/components/button';
import Input from '@/components/input';
import setting from '@/global_states/setting';
import { useState } from 'react';
import useEvent from '@/utils/use_event';
import { URL } from '#/constants/regexp';
import notice from '@/utils/notice';

function SettingDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [serverOrigin, setServerOrigin] = useState(
    () => setting.get().serverOrigin,
  );
  const onSave = useEvent(() => {
    if (!URL.test(serverOrigin)) {
      return notice.error('服务器源地址非法');
    }
    setting.set((s) => ({ ...s, serverOrigin }));

    return onClose();
  });

  return (
    <Dialog open={open}>
      <Container>
        <Title>设置</Title>
        <Content>
          <Input
            label="服务器源地址"
            inputProps={{
              value: serverOrigin,
              onChange: (event) => setServerOrigin(event.target.value),
              placeholder: window.location.origin,
            }}
          />
        </Content>
        <Action>
          <Button onClick={onClose}>取消</Button>
          <Button variant={Variant.PRIMARY} onClick={onSave}>
            确定
          </Button>
        </Action>
      </Container>
    </Dialog>
  );
}

export default SettingDialog;
