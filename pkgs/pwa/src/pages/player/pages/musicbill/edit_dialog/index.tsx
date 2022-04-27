import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import Switch from '@/components/switch';
import Label from '@/components/label';
import IconButton, { Name } from '@/components/icon_button';
import Avatar from '@/components/avatar';
import updateMusicbillRequest, { Key } from '@/server/update_musicbill';
import toast from '@/platform/toast';
import logger from '@/platform/logger';
import { NAME, DESCRIPTION } from '@/constants/musicbill';
import dialog from '@/platform/dialog';
import Dialog, { Content, Action } from '@/components/dialog';
import Button, { Type } from '@/components/button';
import Input from '@/components/input';
import Textarea from '@/components/textarea';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';
import { Musicbill } from '../../../constants';
import useOpen from './use_open';
import eventemitter, { EventType } from '../eventemitter';

const openCoverEditDialog = () =>
  eventemitter.emit(EventType.OPEN_COVER_EDIT_DIALOG);
const StyledContent = styled(Content)`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;
const CoverBox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;
const inputStyle = {
  width: '100%',
};
const textareaStyle = {
  ...inputStyle,
  height: 75,
  resize: 'vertical' as 'vertical',
};

const EditDialog = ({ musicbill }: { musicbill: Musicbill }) => {
  const { open, onClose } = useOpen();

  const [name, setName] = useState('');
  const onNameChange: React.ChangeEventHandler<HTMLInputElement> = (event) =>
    setName(event.target.value);

  const [description, setDescription] = useState('');
  const onDescriptionChange: React.ChangeEventHandler<HTMLTextAreaElement> = (
    event,
  ) => setDescription(event.target.value);

  const [publiz, setPubliz] = useState(false);

  const [saving, setSaving] = useState(false);
  const onSave = async () => {
    if (name.length < NAME.MIN_LENGTH) {
      return toast.error(`"歌单名字"长度应大于等于${NAME.MIN_LENGTH}`);
    }
    if (name.length > NAME.MAX_LENGTH) {
      return toast.error(`"歌单名字"长度应小于等于${NAME.MAX_LENGTH}`);
    }
    if (description.length > DESCRIPTION.MAX_LENGTH) {
      return toast.error(`"歌单描述"长度应小于等于${NAME.MAX_LENGTH}`);
    }
    setSaving(true);
    try {
      let updated = false;

      if (musicbill.name !== name) {
        await updateMusicbillRequest({
          id: musicbill.id,
          key: Key.NAME,
          value: name,
        });
        updated = true;
      }

      if (musicbill.description !== description) {
        await updateMusicbillRequest({
          id: musicbill.id,
          key: Key.DESCRIPTION,
          value: description,
        });
        updated = true;
      }

      if (musicbill.public !== publiz) {
        await updateMusicbillRequest({
          id: musicbill.id,
          key: Key.PUBLIC,
          value: publiz ? '1' : '0',
        });
        updated = true;
      }

      if (updated) {
        playerEventemitter.emit(PlayerEventType.MUSICBILL_UPDATED, {
          id: musicbill.id,
        });
      }

      onClose();
    } catch (error) {
      logger.error(error, { description: '更新歌单信息失败', report: true });
      dialog.alert({ title: '更新歌单信息失败', content: error.message });
    }
    setSaving(false);
  };

  useEffect(() => {
    if (open) {
      setName(musicbill.name);
      setDescription(musicbill.description);
      setPubliz(musicbill.public);
    }
  }, [open, musicbill]);
  return (
    <Dialog open={open}>
      <StyledContent>
        <Label label="封面">
          <CoverBox>
            <Avatar animated src={musicbill.cover} size={80} />
            <IconButton
              name={Name.EDIT_OUTLINE}
              onClick={openCoverEditDialog}
              disabled={saving}
            />
          </CoverBox>
        </Label>
        <Label label="名字">
          <Input
            value={name}
            onChange={onNameChange}
            style={inputStyle}
            maxLength={NAME.MAX_LENGTH}
            disabled={saving}
            type="text"
          />
        </Label>
        <Label label="描述">
          <Textarea
            value={description}
            onChange={onDescriptionChange}
            className="textarea"
            maxLength={DESCRIPTION.MAX_LENGTH}
            disabled={saving}
            style={textareaStyle}
          />
        </Label>
        <Label label="公开">
          <Switch open={publiz} onChange={setPubliz} disabled={saving} />
        </Label>
      </StyledContent>
      <Action>
        <Button label="取消" onClick={onClose} disabled={saving} />
        <Button
          label="更新"
          loading={saving}
          onClick={onSave}
          type={Type.PRIMARY}
        />
      </Action>
    </Dialog>
  );
};

export default React.memo(EditDialog);
