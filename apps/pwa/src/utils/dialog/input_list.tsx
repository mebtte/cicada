import { DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components_next';
import Button from '@/components_next/button';
import Label from '@/components/label';
import Input from '@/components_next/input';
import { useState } from 'react';
import { MdDelete } from 'react-icons/md';
import { t } from '@/i18n';
import DialogBase from './dialog_base';
import { InputList as InputListShape } from './constants';
import useEvent from '../use_event';

function InputListContent({
  onClose,
  options,
}: {
  onClose: () => void;
  options: InputListShape;
}) {
  const [values, setValues] = useState<{ id: number; content: string }[]>(
    () => {
      const from = (options.initialValue || []).map((a) => ({
        id: Math.random(),
        content: a,
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
              <Button
                square
                variant="plain"
                size="sm"
                onClick={() => onDelete(value.id)}
                disabled={confirming || canceling}
              >
                <MdDelete />
              </Button>
            }
          >
            <Input
              value={value.content}
              onChange={(event) => onValueChange(event.target.value, value.id)}
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
  options: InputListShape;
}) {
  return (
    <DialogBase onDestroy={onDestroy} options={options}>
      {({ onClose }) => (
        <InputListContent onClose={onClose} options={options} />
      )}
    </DialogBase>
  );
}

export default Wrapper;
