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
  fileSelect,
}: {
  onClose: () => void;
  fileSelect: FileSelectShape;
}) {
  const [file, setFile] = useState<File | null>(null);

  const [canceling, setCanceling] = useState(false);
  const onCancel = useEvent(() => {
    setCanceling(true);
    return Promise.resolve(
      fileSelect.onCancel ? fileSelect.onCancel() : undefined,
    )
      .then((result) => {
        if (typeof result === 'undefined' || !!result) {
          onClose();
        }
      })
      .finally(() => setCanceling(false));
  });

  const [confirming, setConfirming] = useState(false);
  const onConfirm = () => {
    setConfirming(true);
    return Promise.resolve(
      fileSelect.onConfirm ? fileSelect.onConfirm(file) : undefined,
    )
      .then((result) => {
        if (typeof result === 'undefined' || !!result) {
          onClose();
        }
      })
      .finally(() => setConfirming(false));
  };

  return (
    <Container>
      {fileSelect.title ? <Title>{fileSelect.title}</Title> : null}
      <Content style={contentStyle}>
        <FileSelect
          label={fileSelect.label}
          value={file}
          onChange={(f) => setFile(f)}
          disabled={confirming || canceling}
          acceptTypes={fileSelect.acceptTypes}
          placeholder={fileSelect.placeholder}
        />
      </Content>
      <Action>
        <Button onClick={onCancel} loading={canceling} disabled={confirming}>
          {fileSelect.cancelText || t('cancel')}
        </Button>
        <Button
          variant={fileSelect.confirmVariant}
          onClick={onConfirm}
          loading={confirming}
          disabled={canceling}
        >
          {fileSelect.confirmText || t('confirm')}
        </Button>
      </Action>
    </Container>
  );
}

function Wrapper({
  onDestroy,
  fileSelect,
}: {
  onDestroy: (id: string) => void;
  fileSelect: FileSelectShape;
}) {
  return (
    <DialogBase onDestroy={onDestroy} dialog={fileSelect}>
      {({ onClose }) => (
        <FileSelectContent onClose={onClose} fileSelect={fileSelect} />
      )}
    </DialogBase>
  );
}

export default Wrapper;
