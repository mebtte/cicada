import { Container, Title, Content, Action } from '@/components/dialog';
import Button from '@/components/button';
import { CSSProperties, useState } from 'react';
import MultipleSelect, { Option } from '@/components/multiple_select';
import DialogBase from './dialog_base';
import { MultipleSelect as MultipleSelectShape } from './constants';
import useEvent from '../use_event';

const contentStyle: CSSProperties = { overflow: 'hidden' };

function TextInputContent({
  onClose,
  multipleSelect,
}: {
  onClose: () => void;
  multipleSelect: MultipleSelectShape<unknown>;
}) {
  const [options, setOptions] = useState<Option<unknown>[]>(
    multipleSelect.initialValue || [],
  );
  const onOptionsChange = (os: Option<unknown>[]) => setOptions(os);

  const [canceling, setCanceling] = useState(false);
  const onCancel = useEvent(() => {
    setCanceling(true);
    return Promise.resolve(
      multipleSelect.onCancel ? multipleSelect.onCancel() : undefined,
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
      multipleSelect.onConfirm ? multipleSelect.onConfirm(options) : undefined,
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
      {multipleSelect.title ? <Title>{multipleSelect.title}</Title> : null}
      <Content style={contentStyle}>
        <MultipleSelect<unknown>
          label={multipleSelect.label}
          addon={multipleSelect.labelAddon}
          value={options}
          onChange={onOptionsChange}
          optionsGetter={multipleSelect.optionsGetter}
          disabled={confirming || canceling}
        />
      </Content>
      <Action>
        <Button onClick={onCancel} loading={canceling} disabled={confirming}>
          {multipleSelect.cancelText || '取消'}
        </Button>
        <Button
          variant={multipleSelect.confirmVariant}
          onClick={onConfirm}
          loading={confirming}
          disabled={canceling}
        >
          {multipleSelect.confirmText || '确定'}
        </Button>
      </Action>
    </Container>
  );
}

function Wrapper({
  onDestroy,
  multipleSelect,
}: {
  onDestroy: (id: string) => void;
  multipleSelect: MultipleSelectShape<unknown>;
}) {
  return (
    <DialogBase onDestroy={onDestroy} dialog={multipleSelect}>
      {({ onClose }) => (
        <TextInputContent onClose={onClose} multipleSelect={multipleSelect} />
      )}
    </DialogBase>
  );
}

export default Wrapper;
