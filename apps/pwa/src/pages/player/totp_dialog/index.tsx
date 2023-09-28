import Dialog, { Container, Title, Content, Action } from '@/components/dialog';
import Button, { Variant } from '@/components/button';
import { CSSProperties, useState } from 'react';
import Input from '@/components/input';
import Label from '@/components/label';
import { t } from '@/i18n';
import { useUser } from '@/global_states/server';
import useOpen from './use_open';
import { ZIndex } from '../constants';
import Qrcode from './qrcode';

const maskProps: {
  style: CSSProperties;
} = {
  style: {
    zIndex: ZIndex.DIALOG,
  },
};

function TotpDialog() {
  const { open, onClose } = useOpen();
  const user = useUser()!;

  const [token, setToken] = useState('');
  return (
    <Dialog open={open} maskProps={maskProps}>
      <Container>
        <Title>{user.totpEnabled ? t('disable_2fa') : t('enable_2fa')}</Title>
        <Content>
          {user.totpEnabled ? null : <Qrcode onClose={onClose} />}
          <Label label={t('one_time_token')} className="label">
            <Input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              autoFocus
            />
          </Label>
        </Content>
        <Action>
          <Button onClick={onClose}>{t('cancel')}</Button>
          <Button variant={Variant.PRIMARY}>{t('confirm')}</Button>
        </Action>
      </Container>
    </Dialog>
  );
}

export default TotpDialog;
