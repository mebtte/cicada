import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { easeCubicInOut } from 'd3-ease';
import createMusicbill from '@/server_new/create_musicbill';
import { NAME_MAX_LENGTH } from '#/constants/musicbill';
import toast from '@/platform/toast';
import logger from '#/utils/logger';
import dialog from '@/platform/dialog';
import Dialog, { Title, Content, Action } from '@/components/dialog';
import Button, { Type } from '@/components/button';
import Input from '@/components/input';
import eventemitter, { EventType } from './eventemitter';

const DIALOG_TRANSITION_DURATION = 650;

const springConfig = {
  duration: DIALOG_TRANSITION_DURATION,
  easing: easeCubicInOut,
};
const inputStyle = {
  display: 'block',
  width: '100%',
};

function CreateMusicbillDialog() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => {
    inputRef.current!.value = '';
    setOpen(false);
  }, []);
  const onCreate = async () => {
    const name = inputRef.current!.value;
    if (!name.length) {
      return toast.error('请输入乐单名');
    }
    if (name.length > NAME_MAX_LENGTH) {
      return toast.error(`乐单名长度应小于等于${NAME_MAX_LENGTH}`);
    }
    setCreating(true);
    try {
      await createMusicbill(name);
      eventemitter.emit(EventType.RELOAD_MUSICBILL_LIST, {});
      onClose();
    } catch (error) {
      logger.error(error, '创建乐单失败');
      dialog.alert({
        title: '创建乐单失败',
        content: error.message,
      });
    }
    setCreating(false);
  };

  useEffect(() => {
    const listener = () => {
      setOpen(true);
      setTimeout(
        () => inputRef.current && inputRef.current.focus(),
        DIALOG_TRANSITION_DURATION,
      );
    };
    eventemitter.on(EventType.OPEN_CREATE_MUSICBILL_DIALOG, listener);
    return () =>
      void eventemitter.off(EventType.OPEN_CREATE_MUSICBILL_DIALOG, listener);
  }, []);

  return (
    <Dialog open={open} springConfig={springConfig}>
      <Title>创建乐单</Title>
      <Content>
        <Input
          ref={inputRef}
          type="text"
          style={inputStyle}
          placeholder="乐单名字"
          disabled={creating}
        />
      </Content>
      <Action>
        <Button label="取消" onClick={onClose} disabled={creating} />
        <Button
          label="创建"
          onClick={onCreate}
          loading={creating}
          type={Type.PRIMARY}
        />
      </Action>
    </Dialog>
  );
}

export default memo(CreateMusicbillDialog);
