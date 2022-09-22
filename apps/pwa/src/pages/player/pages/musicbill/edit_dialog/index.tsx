import { useState, useEffect } from 'react';
import * as React from 'react';
import styled from 'styled-components';
import Switch from '@/components/switch';
import Label from '@/components/label';
import IconButton, { Name } from '@/components/icon_button';
import Avatar from '@/components/avatar';
import updateMusicbillRequest from '@/server/update_musicbill';
import toast from '@/platform/toast';
import logger from '#/utils/logger';
import { AllowUpdateKey, NAME_MAX_LENGTH } from '#/constants/musicbill';
import dialog from '@/platform/dialog';
import Dialog, { Content, Action } from '@/components/dialog';
import Button, { Type } from '@/components/button';
import Input from '@/components/input';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';
import { Musicbill } from '../../../constants';
import useOpen from './use_open';
import eventemitter, { EventType } from '../eventemitter';

const openCoverEditDialog = () =>
  eventemitter.emit(EventType.OPEN_COVER_EDIT_DIALOG, null);
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

function EditDialog({ musicbill }: { musicbill: Musicbill }) {
  const { open, onClose } = useOpen();

  const [name, setName] = useState('');
  const onNameChange: React.ChangeEventHandler<HTMLInputElement> = (event) =>
    setName(event.target.value);

  const [publiz, setPubliz] = useState(false);

  const [saving, setSaving] = useState(false);
  const onSave = async () => {
    if (!name.length) {
      return toast.error('请输入乐单名');
    }
    if (name.length > NAME_MAX_LENGTH) {
      return toast.error(`乐单名长度应小于等于${NAME_MAX_LENGTH}`);
    }
    setSaving(true);
    try {
      let updated = false;

      if (musicbill.name !== name) {
        await updateMusicbillRequest(musicbill.id, AllowUpdateKey.NAME, name);
        updated = true;
      }

      if (musicbill.public !== publiz) {
        await updateMusicbillRequest(
          musicbill.id,
          AllowUpdateKey.PUBLIC,
          publiz,
        );
        updated = true;
      }

      if (updated) {
        playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL_LIST, null);
      }

      onClose();
    } catch (error) {
      logger.error(error, '更新乐单信息失败');
      dialog.alert({ title: '更新乐单信息失败', content: error.message });
    }
    setSaving(false);
  };

  useEffect(() => {
    if (open) {
      setName(musicbill.name);
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
            maxLength={NAME_MAX_LENGTH}
            disabled={saving}
            type="text"
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
}

export default React.memo(EditDialog);
