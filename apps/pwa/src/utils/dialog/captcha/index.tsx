import { Container, Content, Action } from '@/components/dialog';
import Button from '@/components/button';
import Label from '@/components/label';
import Input from '@/components/input';
import {
  CSSProperties,
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

const contentStyle: CSSProperties = { overflow: 'hidden' };
const captchaStyle: CSSProperties = {
  marginBottom: 10,
};

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
    <Container>
      <Content style={contentStyle}>
        <Captcha
          captchaData={captchaData}
          reload={reload}
          style={captchaStyle}
        />
        <Label label={t('captcha')}>
          <Input
            value={captchaValue}
            onChange={onCaptchaValueChange}
            autoFocus
            onKeyDown={onKeyDown}
          />
        </Label>
      </Content>
      <Action>
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
      </Action>
    </Container>
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
