import {
  memo,
  useState,
  useEffect,
  useCallback,
  ChangeEventHandler,
} from 'react';
import createMusicbill from '@/server/create_musicbill';
import { NAME_MAX_LENGTH } from '#/constants/musicbill';
import notice from '#/utils/notice';
import logger from '#/utils/logger';
import dialog from '#/utils/dialog';
import Dialog, { Title, Content, Action } from '#/components/dialog';
import Button, { Type } from '@/components/button';
import Input from '#/components/input';
import eventemitter, { EventType } from './eventemitter';

function CreateMusicbillDialog() {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const onNameChange: ChangeEventHandler<HTMLInputElement> = (e) =>
    setName(e.target.value);

  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => {
    setName('');
    setOpen(false);
  }, []);
  const onCreate = async () => {
    if (!name.length) {
      return notice.error('请输入乐单名');
    }
    if (name.length > NAME_MAX_LENGTH) {
      return notice.error(`乐单名长度应小于等于${NAME_MAX_LENGTH}`);
    }
    setCreating(true);
    try {
      await createMusicbill(name);
      eventemitter.emit(EventType.RELOAD_MUSICBILL_LIST, null);
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
    const unlistenOpenCreateMusicbillDialog = eventemitter.listen(
      EventType.OPEN_CREATE_MUSICBILL_DIALOG,
      () => setOpen(true),
    );
    return unlistenOpenCreateMusicbillDialog;
  }, []);

  return (
    <Dialog open={open}>
      <Title>创建乐单</Title>
      <Content>
        <Input
          label="名字"
          inputProps={{ value: name, onChange: onNameChange, autoFocus: true }}
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
