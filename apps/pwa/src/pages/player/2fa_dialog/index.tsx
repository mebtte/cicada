import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components_next';
import Button from '@/components_next/button';
import { useState } from 'react';
import Input from '@/components_next/input';
import { t } from '@/i18n';
import { reloadUser, useUser } from '@/global_states/server';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import disable2FA from '@/server/api/disable_2fa';
import enable2FA from '@/server/api/enable_2fa';
import sleep from '#/utils/sleep';
import Qrcode from './qrcode';
import useOpen from './use_open';

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
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent showClose={false} aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{user.twoFAEnabled ? t('disable_2fa') : t('enable_2fa')}</DialogTitle>
        </DialogHeader>
        <DialogBody style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {user.twoFAEnabled ? null : <Qrcode onClose={onClose} />}
          <Input
            label={t('2fa_token')}
            value={twoFAToken}
            onChange={(event) => setTwoFAToken(event.target.value)}
            autoFocus
          />
        </DialogBody>
        <DialogFooter>
          <Button onClick={onClose} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button
            variant={'primary'}
            disabled={!twoFAToken.length}
            loading={loading}
            onClick={onConfirm}
          >
            {t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TwoFADialog;
