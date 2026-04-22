import { DialogBody, DialogFooter } from '@/components_next';
import Button from '@/components_next/button';
import Input from '@/components_next/input';
import {
  ChangeEventHandler,
  useEffect,
  useState,
  useCallback,
  KeyboardEventHandler,
} from 'react';
import { t } from '@/i18n';
import Captcha from './captcha';
import useCaptcha from './use_captcha';
import DialogBase from '../dialog_base';
import { Captcha as CaptchaShape } from '../constants';
import useEvent from '../../use_event';
import notice from '../../notice';

function CaptchaContent({
  onClose,
  options,
}: {
  onClose: () => void;
  options: CaptchaShape;
}) {
  const { captchaData, reload } = useCaptcha();
  const [captchaValue, setCaptchaValue] = useState('');
  const onCaptchaValueChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setCaptchaValue(event.target.value.replace(/\s/g, ''));

  useEffect(() => {
    setCaptchaValue('');
  }, [captchaData]);

  const [canceling, setCanceling] = useState(false);
  const onCancel = useEvent(() => {
    setCanceling(true);
    return Promise.resolve(options.onCancel ? options.onCancel() : undefined)
      .then((result) => {
        if (result === undefined || !!result) {
          onClose();
        }
      })
      .finally(() => setCanceling(false));
  });

  const [confirming, setConfirming] = useState(false);
  const onConfirm = useEvent(() => {
    if (!captchaData.data) {
      return notice.error(t('wrong_captcha'));
    }

    if (!captchaValue) {
      return notice.error(t('empty_captcha_warning'));
    }

    setConfirming(true);
    return Promise.resolve(
      options.onConfirm
        ? options.onConfirm({ captchaId: captchaData.data?.id, captchaValue })
        : undefined,
    )
      .then((result) => {
        if (result === undefined || !!result) {
          onClose();
        } else {
          reload();
        }
      })
      .finally(() => setConfirming(false));
  });

  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        onConfirm();
      }
    },
    [onConfirm],
  );

  return (
    <>
      <DialogBody style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Captcha captchaData={captchaData} reload={reload} />
        <Input
          label={t('captcha')}
          value={captchaValue}
          onChange={onCaptchaValueChange}
          autoFocus
          onKeyDown={onKeyDown}
        />
      </DialogBody>
      <DialogFooter>
        <Button onClick={onCancel} loading={canceling} disabled={confirming}>
          {options.cancelText || t('cancel')}
        </Button>
        <Button
          variant={options.confirmVariant}
          onClick={onConfirm}
          loading={confirming}
          disabled={canceling}
        >
          {options.confirmText || t('confirm')}
        </Button>
      </DialogFooter>
    </>
  );
}

function Wrapper({
  onDestroy,
  options,
}: {
  onDestroy: (id: string) => void;
  options: CaptchaShape;
}) {
  return (
    <DialogBase onDestroy={onDestroy} options={options}>
      {({ onClose }) => <CaptchaContent onClose={onClose} options={options} />}
    </DialogBase>
  );
}

export default Wrapper;
