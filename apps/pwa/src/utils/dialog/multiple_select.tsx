import { Container, Title, Content, Action } from '@/components/dialog';
import Button from '@/components/button';
import Label from '@/components/label';
import { CSSProperties, useState } from 'react';
import { t } from '@/i18n';
import { MultipleSelect, Option } from '@/components/select';
import DialogBase from './dialog_base';
import { MultipleSelect as MultipleSelectShape } from './constants';
import useEvent from '../use_event';

const contentStyle: CSSProperties = { overflow: 'hidden' };

function MultipleSelectContent({
  onClose,
  options: multipleSelectOptions,
}: {
  onClose: () => void;
  options: MultipleSelectShape<unknown>;
}) {
  const [options, setOptions] = useState<Option<unknown>[]>(
    multipleSelectOptions.initialValue || [],
  );
  const onOptionsChange = (os: Option<unknown>[]) => setOptions(os);

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
        ? multipleSelectOptions.onConfirm(options)
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
    <Container>
      {multipleSelectOptions.title ? (
        <Title>{multipleSelectOptions.title}</Title>
      ) : null}
      <Content style={contentStyle}>
        <Label
          label={multipleSelectOptions.label}
          addon={multipleSelectOptions.labelAddon}
        >
          <MultipleSelect<unknown>
            value={options}
            onChange={onOptionsChange}
            optionsGetter={multipleSelectOptions.optionsGetter}
            disabled={confirming || canceling}
          />
        </Label>
      </Content>
      <Action>
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
      </Action>
    </Container>
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
