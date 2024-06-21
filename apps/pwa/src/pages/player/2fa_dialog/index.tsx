import Dialog, { Container, Title, Content, Action } from '@/components/dialog';
import Button, { Variant } from '@/components/button';
import { CSSProperties, useState } from 'react';
import Input from '@/components/input';
import Label from '@/components/label';
import { t } from '@/i18n';
import { reloadUser, useUser } from '@/global_states/server';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import disable2FA from '@/server/api/disable_2fa';
import enable2FA from '@/server/api/enable_2fa';
import sleep from '#/utils/sleep';
import Qrcode from './qrcode';
import { ZIndex } from '../constants';
import useOpen from './use_open';

const maskProps: {
  style: CSSProperties;
} = {
  style: {
    zIndex: ZIndex.DIALOG,
  },
};

function TwoFADialog() {
  const { open, onClose } = useOpen();
  const user = useUser()!;

  const [loading, setLoading] = useState(false);
  const [twoFAToken, setTwoFAToken] = useState('');
  const onConfirm = async () => {
    setLoading(true);
    try {
      if (user.twoFAEnabled) {
        await disable2FA({ twoFAToken });
      } else {
        await enable2FA({ twoFAToken });
      }
      onClose();

      /**
       * make sure reload user after closing dialog
       * @author mebtte<i@mebtte.com>
       */
      await sleep(1000);
      await reloadUser();
    } catch (error) {
      logger.error(
        error,
        user.twoFAEnabled ? 'Failed to disable 2FA' : 'Failed to enable 2FA',
      );
      notice.error(error.message);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} maskProps={maskProps}>
      <Container>
        <Title>{user.twoFAEnabled ? t('disable_2fa') : t('enable_2fa')}</Title>
        <Content>
          {user.twoFAEnabled ? null : <Qrcode onClose={onClose} />}
          <Label label={t('2fa_token')} className="label">
            <Input
              value={twoFAToken}
              onChange={(event) => setTwoFAToken(event.target.value)}
              autoFocus
            />
          </Label>
        </Content>
        <Action>
          <Button onClick={onClose} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button
            variant={Variant.PRIMARY}
            disabled={!twoFAToken.length}
            loading={loading}
            onClick={onConfirm}
          >
            {t('confirm')}
          </Button>
        </Action>
      </Container>
    </Dialog>
  );
}

export default TwoFADialog;
