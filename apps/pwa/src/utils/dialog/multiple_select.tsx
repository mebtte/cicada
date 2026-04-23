import { DialogHeader, DialogTitle, DialogBody, DialogFooter, Label, MultiSelect, SelectOption } from '@/components_next';
import Button from '@/components_next/button';
import { useState } from 'react';
import { t } from '@/i18n';
import DialogBase from './dialog_base';
import { MultipleSelect as MultipleSelectShape } from './constants';
import useEvent from '../use_event';

function MultipleSelectContent({
  onClose,
  options: multipleSelectOptions,
}: {
  onClose: () => void;
  options: MultipleSelectShape<unknown>;
}) {
  const [value, setValue] = useState<SelectOption<unknown>[]>(
    multipleSelectOptions.initialValue || [],
  );

  const [canceling, setCanceling] = useState(false);
  const onCancel = useEvent(() => {
    setCanceling(true);
    return Promise.resolve(
      multipleSelectOptions.onCancel
        ? multipleSelectOptions.onCancel()
        : undefined,
    )
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
      multipleSelectOptions.onConfirm
        ? multipleSelectOptions.onConfirm(value)
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
      {multipleSelectOptions.title && (
        <DialogHeader>
          <DialogTitle>{multipleSelectOptions.title}</DialogTitle>
        </DialogHeader>
      )}
      <DialogBody>
        <Label
          label={multipleSelectOptions.label}
          addon={multipleSelectOptions.labelAddon}
        >
          <MultiSelect<unknown>
            value={value}
            onChange={setValue}
            loadOptions={multipleSelectOptions.loadOptions}
            disabled={confirming || canceling}
          />
        </Label>
      </DialogBody>
      <DialogFooter>
        <Button onClick={onCancel} loading={canceling} disabled={confirming}>
          {multipleSelectOptions.cancelText || t('cancel')}
        </Button>
        <Button
          variant={multipleSelectOptions.confirmVariant}
          onClick={onConfirm}
          loading={confirming}
          disabled={canceling}
        >
          {multipleSelectOptions.confirmText || t('confirm')}
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
  options: MultipleSelectShape<unknown>;
}) {
  return (
    <DialogBase onDestroy={onDestroy} options={options}>
      {({ onClose }) => (
        <MultipleSelectContent onClose={onClose} options={options} />
      )}
    </DialogBase>
  );
}

export default Wrapper;
