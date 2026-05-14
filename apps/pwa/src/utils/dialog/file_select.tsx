import { DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components';
import Button from '@/components/button';
import { useState } from 'react';
import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import DialogBase from './dialog_base';
import { DEFAULT_CANCEL_VARIANT, FileSelect as FileSelectShape } from './constants';
import useEvent from '../use_event';
import selectFile from '../select_file';

const Body = styled(DialogBody)`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SelectedFile = styled.div`
  padding: 12px 14px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 4px 0 rgb(185 185 185);
  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
`;

const FileName = styled.div`
  color: rgb(75 75 75);
  font-size: 14px;
  font-weight: 800;
  line-height: 1.35;
  overflow-wrap: anywhere;
`;

const FileSize = styled.div`
  margin-top: 4px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: 12px;
  font-weight: 700;
`;

const SelectFileButton = styled(Button)`
  margin-right: auto;
`;

const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size}B`;
  }
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)}KB`;
  }
  return `${(size / 1024 / 1024).toFixed(2)}MB`;
};

function FileSelectContent({
  onClose,
  options,
}: {
  onClose: () => void;
  options: FileSelectShape;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const onSelectFile = useEvent(() => {
    if (confirming || canceling) {
      return;
    }
    return selectFile({
      acceptTypes: options.acceptTypes,
      onSelect: setFile,
    });
  });

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
    <>
      {options.title && (
        <DialogHeader>
          <DialogTitle>{options.title}</DialogTitle>
        </DialogHeader>
      )}
      {file ? (
        <Body>
          <SelectedFile>
            <FileName>{file.name}</FileName>
            <FileSize>{formatFileSize(file.size)}</FileSize>
          </SelectedFile>
        </Body>
      ) : null}
      <DialogFooter $inline={options.inlineFooter}>
        <SelectFileButton
          variant="secondary"
          onClick={onSelectFile}
          disabled={confirming || canceling}
        >
          {t('select_file')}
        </SelectFileButton>
        <Button
          variant={options.cancelVariant ?? DEFAULT_CANCEL_VARIANT}
          onClick={onCancel}
          loading={canceling}
          disabled={confirming}
        >
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
