import { useState } from 'react';
import styled from 'styled-components';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components';
import Button from '@/components/button';
import { t } from '@/i18n';
import { DEFAULT_CANCEL_VARIANT, Actions as ActionsShape } from './constants';
import useEvent from '../use_event';
import DialogBase from './dialog_base';

const ActionsFooter = styled(DialogFooter)`
  gap: 12px;

  > button {
    width: 100%;
    min-width: 0;
  }

  @media (min-width: 640px) {
    flex-direction: column;
    gap: 14px;

    > button {
      width: 100%;
      min-width: 0;
    }
  }
`;

function isSimpleContent(content: ActionsShape['content']) {
  return typeof content === 'string' || typeof content === 'number';
}

function ActionsContent({
  options,
  onClose,
}: {
  options: ActionsShape;
  onClose: () => void;
}) {
  const [canceling, setCanceling] = useState(false);
  const [actingIndex, setActingIndex] = useState<number | null>(null);
  const disabled = canceling || actingIndex !== null;

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

  const onAction = useEvent((index: number) => {
    const action = options.actions[index];
    setActingIndex(index);
    return Promise.resolve(action.onClick ? action.onClick() : undefined)
      .then((result) => {
        if (result === undefined || !!result) {
          onClose();
        }
      })
      .finally(() => setActingIndex(null));
  });

  return (
    <>
      {options.title && (
        <DialogHeader>
          <DialogTitle>{options.title}</DialogTitle>
          {isSimpleContent(options.content) && (
            <DialogDescription>{options.content}</DialogDescription>
          )}
        </DialogHeader>
      )}
      {options.content && (!options.title || !isSimpleContent(options.content)) && (
        <DialogBody>{options.content}</DialogBody>
      )}
      <ActionsFooter>
        {options.actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant ?? 'primary'}
            onClick={() => onAction(index)}
            loading={actingIndex === index}
            disabled={disabled && actingIndex !== index}
          >
            {action.text}
          </Button>
        ))}
        <Button
          variant={options.cancelVariant ?? DEFAULT_CANCEL_VARIANT}
          onClick={onCancel}
          loading={canceling}
          disabled={actingIndex !== null}
        >
          {options.cancelText || t('cancel')}
        </Button>
      </ActionsFooter>
    </>
  );
}

function Actions({
  options,
  onDestroy,
}: {
  options: ActionsShape;
  onDestroy: (id: string) => void;
}) {
  return (
    <DialogBase onDestroy={onDestroy} options={options}>
      {({ onClose }) => <ActionsContent onClose={onClose} options={options} />}
    </DialogBase>
  );
}

export default Actions;
