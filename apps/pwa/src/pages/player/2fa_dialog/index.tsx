import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components';
import Button from '@/components/button';
import { useEffect, useState } from 'react';
import Input from '@/components/input';
import { t } from '@/i18n';
import { reloadUser, useUser } from '@/global_states/server';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import dialog from '@/utils/dialog';
import disable2FA from '@/server/api/disable_2fa';
import enable2FA from '@/server/api/enable_2fa';
import { ExceptionCode } from '@/constants/exception';
import Qrcode from './qrcode';
import useOpen from './use_open';

type Mode = 'enable' | 'disable';

function TwoFADialog() {
  const { open, onClose } = useOpen();
  const user = useUser()!;

  const [loading, setLoading] = useState(false);
  const [twoFAToken, setTwoFAToken] = useState('');
  // 打开时快照模式, 避免 reloadUser 后对话框退场动画里文案翻转
  const [mode, setMode] = useState<Mode>(user.twoFAEnabled ? 'disable' : 'enable');

  useEffect(() => {
    if (open) {
      setTwoFAToken('');
      setMode(user.twoFAEnabled ? 'disable' : 'enable');
    }
  }, [open, user.twoFAEnabled]);

  const onConfirm = async () => {
    setLoading(true);
    try {
      if (mode === 'disable') {
        await disable2FA({ twoFAToken });
      } else {
        await enable2FA({ twoFAToken });
      }
      onClose();
      await reloadUser();
    } catch (error) {
      logger.error(
        error,
        mode === 'disable' ? 'Failed to disable 2FA' : 'Failed to enable 2FA',
      );
      if (error.code === ExceptionCode.WRONG_2FA_TOKEN) {
        dialog.alert({ content: error.message });
      } else {
        notice.error(error.message);
      }
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent showClose={false} aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{mode === 'disable' ? t('disable_2fa') : t('enable_2fa')}</DialogTitle>
        </DialogHeader>
        <DialogBody style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'disable' ? null : <Qrcode onClose={onClose} />}
          <Input
            label={t('2fa_token')}
            value={twoFAToken}
            onChange={(event) => setTwoFAToken(event.target.value)}
            autoFocus
          />
        </DialogBody>
        <DialogFooter $inline>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
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
