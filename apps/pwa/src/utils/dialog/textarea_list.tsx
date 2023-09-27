import { Container, Title, Content, Action } from '@/components/dialog';
import Button from '@/components/button';
import Textarea from '@/components/textarea';
import Label from '@/components/label';
import { CSSProperties, useState } from 'react';
import IconButton from '@/components/icon_button';
import { ComponentSize } from '@/constants/style';
import { MdDelete, MdUploadFile } from 'react-icons/md';
import styled from 'styled-components';
import { t } from '@/i18n';
import DialogBase from './dialog_base';
import { TextareaList as TextareaListShape } from './constants';
import useEvent from '../use_event';
import selectFile from '../select_file';

const bodyProps: { style: CSSProperties } = {
  style: { width: 'min(750px, 80%)' },
};
const StyledContent = styled(Content)`
  display: flex;
  flex-direction: column;
  gap: 10px;

  > .action {
    flex-shrink: 0;
  }
`;
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
    <Container>
      {options.title ? <Title>{options.title}</Title> : null}
      <StyledContent>
        {values.map((value, index) => (
          <Label
            key={value.id}
            label={`${options.label} ${index + 1}`}
            addon={
              <Addon>
                <IconButton
                  size={ComponentSize.SMALL}
                  onClick={() => onOpenFile(value.id)}
                  disabled={confirming || canceling}
                >
                  <MdUploadFile />
                </IconButton>
                <IconButton
                  size={ComponentSize.SMALL}
                  onClick={() => onDelete(value.id)}
                  disabled={confirming || canceling}
                >
                  <MdDelete />
                </IconButton>
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
            className="action"
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
      </StyledContent>
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
  options: TextareaListShape;
}) {
  return (
    <DialogBase bodyProps={bodyProps} onDestroy={onDestroy} options={options}>
      {({ onClose }) => (
        <TextareaListContent onClose={onClose} options={options} />
      )}
    </DialogBase>
  );
}

export default Wrapper;
