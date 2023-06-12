import { Container, Title, Content, Action } from '@/components/dialog';
import Button from '@/components/button';
import Textarea from '@/components/textarea';
import { CSSProperties, useState } from 'react';
import IconButton from '@/components/icon_button';
import { ComponentSize } from '@/constants/style';
import { MdDelete, MdUploadFile } from 'react-icons/md';
import styled from 'styled-components';
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

function TextareaListContent({
  onClose,
  textareaList,
}: {
  onClose: () => void;
  textareaList: TextareaListShape;
}) {
  const [values, setValues] = useState<{ id: number; content: string }[]>(
    () => {
      const from = (textareaList.initialValue || []).map((t) => ({
        id: Math.random(),
        content: t,
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
    return Promise.resolve(
      textareaList.onCancel ? textareaList.onCancel() : undefined,
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
      textareaList.onConfirm
        ? textareaList.onConfirm(values.map((v) => v.content))
        : undefined,
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
      {textareaList.title ? <Title>{textareaList.title}</Title> : null}
      <StyledContent>
        {values.map((value, index) => (
          <Textarea
            key={value.id}
            label={`${textareaList.label} ${index + 1}`}
            addon={
              <>
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
              </>
            }
            textareaProps={{
              value: value.content,
              onChange: (event) => onValueChange(event.target.value, value.id),
              placeholder: textareaList.placeholder,
              rows: 8,
              maxLength: textareaList.maxLength,
            }}
            disabled={confirming || canceling}
          />
        ))}
        {values.length >= textareaList.max! ? null : (
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
            新增{textareaList.label}
          </Button>
        )}
      </StyledContent>
      <Action>
        <Button onClick={onCancel} loading={canceling} disabled={confirming}>
          {textareaList.cancelText || '取消'}
        </Button>
        <Button
          variant={textareaList.confirmVariant}
          onClick={onConfirm}
          loading={confirming}
          disabled={canceling}
        >
          {textareaList.confirmText || '确定'}
        </Button>
      </Action>
    </Container>
  );
}

function Wrapper({
  onDestroy,
  textareaList,
}: {
  onDestroy: (id: string) => void;
  textareaList: TextareaListShape;
}) {
  return (
    <DialogBase
      bodyProps={bodyProps}
      onDestroy={onDestroy}
      dialog={textareaList}
    >
      {({ onClose }) => (
        <TextareaListContent onClose={onClose} textareaList={textareaList} />
      )}
    </DialogBase>
  );
}

export default Wrapper;
