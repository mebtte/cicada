import { DialogHeader, DialogTitle, DialogBody, DialogFooter, Label } from '@/components';
import Button from '@/components/button';
import Textarea from '@/components/textarea';
import { useState } from 'react';
import { MdUploadFile } from 'react-icons/md';
import { Delete } from '@/components/icon';
import styled from 'styled-components';
import { t } from '@/i18n';
import DialogBase from './dialog_base';
import { DEFAULT_CANCEL_VARIANT, TextareaList as TextareaListShape } from './constants';
import useEvent from '../use_event';
import selectFile from '../select_file';

const Addon = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

function TextareaListContent({
  onClose,
  options,
}: {
  onClose: () => void;
  options: TextareaListShape;
}) {
  const [values, setValues] = useState<{ id: number; content: string }[]>(
    () => {
      const from = (options.initialValue || []).map((v) => ({
        id: Math.random(),
        content: v,
      }));
      return from.length ? from : [{ id: Math.random(), content: '' }];
    },
  );
  const onValueChange = (content: string, id: number) =>
    setValues((ls) =>
      ls.map((l) =>
        l.id === id
          ? {
              ...l,
              content,
            }
          : l,
      ),
    );
  const onDelete = (id: number) =>
    setValues((vs) => vs.filter((v) => v.id !== id));
  const onOpenFile = (id: number) =>
    selectFile({
      acceptTypes: ['text/plain'],
      onSelect: (file) => {
        if (file) {
          const reader = new window.FileReader();
          reader.readAsText(file);
          reader.addEventListener('load', () =>
            setValues((vs) =>
              vs.map((v) =>
                v.id === id
                  ? {
                      ...v,
                      content: (reader.result as string) || v.content,
                    }
                  : v,
              ),
            ),
          );
        }
      },
    });

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
      options.onConfirm
        ? options.onConfirm(values.map((v) => v.content))
        : undefined,
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
      <DialogBody style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {values.map((value, index) => (
          <Label
            key={value.id}
            label={`${options.label} ${index + 1}`}
            addon={
              <Addon>
                <Button
                  square
                  variant="plain"
                  size="sm"
                  onClick={() => onOpenFile(value.id)}
                  disabled={confirming || canceling}
                >
                  <MdUploadFile />
                </Button>
                <Button
                  square
                  variant="plain"
                  size="sm"
                  onClick={() => onDelete(value.id)}
                  disabled={confirming || canceling}
                >
                  <Delete />
                </Button>
              </Addon>
            }
          >
            <Textarea
              value={value.content}
              onChange={(event) => onValueChange(event.target.value, value.id)}
              placeholder={options.placeholder}
              rows={8}
              maxLength={options.maxLength}
              disabled={confirming || canceling}
            />
          </Label>
        ))}
        {values.length >= options.max! ? null : (
          <Button
            onClick={() =>
              setValues((vs) => [
                ...vs,
                {
                  id: Math.random(),
                  content: '',
                },
              ])
            }
            disabled={confirming || canceling}
          >
            {t('add')} {options.label}
          </Button>
        )}
      </DialogBody>
      <DialogFooter>
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
  options: TextareaListShape;
}) {
  return (
    <DialogBase onDestroy={onDestroy} options={options}>
      {({ onClose }) => (
        <TextareaListContent onClose={onClose} options={options} />
      )}
    </DialogBase>
  );
}

export default Wrapper;
