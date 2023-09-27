import { Container, Title, Content, Action } from '@/components/dialog';
import Button from '@/components/button';
import { CSSProperties, useState } from 'react';
import FileSelect from '@/components/file_select';
import { t } from '@/i18n';
import DialogBase from './dialog_base';
import { FileSelect as FileSelectShape } from './constants';
import useEvent from '../use_event';

const contentStyle: CSSProperties = { overflow: 'hidden' };

function FileSelectContent({
  onClose,
  options,
}: {
  onClose: () => void;
  options: FileSelectShape;
}) {
  const [file, setFile] = useState<File | null>(null);

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
  const onConfirm = () => {
    setConfirming(true);
    return Promise.resolve(
      options.onConfirm ? options.onConfirm(file) : undefined,
    )
      .then((result) => {
        if (result === undefined || !!result) {
          onClose();
        }
      })
      .finally(() => setConfirming(false));
  };

  return (
    <Container>
      {options.title ? <Title>{options.title}</Title> : null}
      <Content style={contentStyle}>
        <FileSelect
          label={options.label}
          value={file}
          onChange={(f) => setFile(f)}
          disabled={confirming || canceling}
          acceptTypes={options.acceptTypes}
          placeholder={options.placeholder}
        />
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
  options: FileSelectShape;
}) {
  return (
    <DialogBase onDestroy={onDestroy} options={options}>
      {({ onClose }) => (
        <FileSelectContent onClose={onClose} options={options} />
      )}
    </DialogBase>
  );
}

export default Wrapper;
