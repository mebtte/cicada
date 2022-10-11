import Dialog, { Title, Content, Action } from '#/components/dialog';
import Button, { Variant } from '#/components/button';
import Input from '#/components/input';
import { ChangeEventHandler, useEffect, useState } from 'react';
import useEvent from '#/utils/use_event';
import notice from '#/utils/notice';
import createSinger from '@/server/create_singer';
import { ExceptionCode } from '#/constants/exception';
import dialog from '#/utils/dialog';
import { NAME_MAX_LENGTH } from '#/constants/singer';
import useOpen from './use_open';
import e, { EventType } from '../eventemitter';

function CreateSingerDialog() {
  const { open, onClose } = useOpen();

  const [name, setName] = useState('');
  const onNameChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setName(event.target.value);

  const [loading, setLoading] = useState(false);
  const onCreate = useEvent(async (force: boolean) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return void notice.error('请输入名字');
    }

    setLoading(true);
    try {
      await createSinger({ name: trimmedName, force });

      notice.success('已创建歌手');
      e.emit(EventType.RELOAD_SINGER_LIST, null);
      onClose();
    } catch (error) {
      if (error.code === ExceptionCode.SINGER_EXIST) {
        dialog.confirm({
          title: '歌手已存在, 是否仍要创建?',
          content:
            '重复的歌手难以进行分类, 通常情况下只有两个歌手同名才会重复创建',
          onConfirm: () => onCreate(true).finally(() => true),
        });
      } else {
        notice.error(error.message);
      }
    }
    setLoading(false);
  });

  useEffect(() => {
    if (!open) {
      setName('');
    }
  }, [open]);

  return (
    <Dialog open={open}>
      <Title>创建歌手</Title>
      <Content>
        <Input
          label="名字"
          inputProps={{
            value: name,
            onChange: onNameChange,
            maxLength: NAME_MAX_LENGTH,
            autoFocus: true,
          }}
          disabled={loading}
        />
      </Content>
      <Action>
        <Button onClick={onClose} disabled={loading}>
          取消
        </Button>
        <Button
          variant={Variant.PRIMARY}
          onClick={() => onCreate(false)}
          loading={loading}
        >
          创建
        </Button>
      </Action>
    </Dialog>
  );
}

export default CreateSingerDialog;
