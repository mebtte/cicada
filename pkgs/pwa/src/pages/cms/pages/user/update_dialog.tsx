import React, { useEffect, useState } from 'react';

import { REMARK_MAX_LENGTH } from '@/constants/user';
import Select from '@/components/select';
import cmsUpdateUser, { Key } from '@/server/cms_update_user';
import logger from '@/platform/logger';
import toast from '@/platform/toast';
import Label from '@/components/label';
import Textarea from '@/components/textarea';
import Button, { Type as ButtonType } from '@/components/button';
import Dialog, { Title, Content, Action } from '@/components/dialog';
import { User } from './constants';
import eventemitter, { EventType } from './eventemitter';

const labelStyle = {
  marginBottom: 20,
};
const selectStyle = {
  width: '100%',
};
const textareaStyle = {
  ...selectStyle,
  height: 100,
  resize: 'vertical' as 'vertical',
};
const SELECT_LIST: (0 | 1)[] = [0, 1];
const itemRenderer = (d: 0 | 1 | null) => {
  if (d === 1) {
    return '禁用';
  }
  return '可用';
};

const UpdateDialog = () => {
  const [user, setUser] = useState<User | null>(null);
  const onClose = () => setUser(null);

  const [remark, setRemark] = useState('');
  const onRemarkChange = (event: React.ChangeEvent<HTMLTextAreaElement>) =>
    setRemark(event.target.value);

  const [disabled, setDisabled] = useState<0 | 1>(1);
  const onDisabledChange = (d: 0 | 1) => setDisabled(d);

  const [loading, setLoading] = useState(false);
  const onUpdate = async () => {
    if (!remark) {
      return toast.error('请输入备注');
    }
    setLoading(true);
    try {
      let updated = false;

      if (user.disabled !== disabled) {
        await cmsUpdateUser({
          id: user.id,
          key: Key.DISABLED,
          value: disabled,
        });
        updated = true;
      }

      if (user.remark !== remark) {
        await cmsUpdateUser({ id: user.id, key: Key.REMARK, value: remark });
        updated = true;
      }

      if (updated) {
        eventemitter.emit(EventType.USER_UPDATED, { id: user.id });
      }

      onClose();
    } catch (error) {
      logger.error(error, { description: '更新用户失败', report: true });
      toast.error(error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    const openListener = ({ user: u }: { user: User }) => {
      setUser(u);
      setRemark(u.remark);
      setDisabled(u.disabled);
    };
    eventemitter.on(EventType.OPEN_UPDATE_DIALOG, openListener);
    return () =>
      void eventemitter.off(EventType.OPEN_UPDATE_DIALOG, openListener);
  }, []);

  return (
    <Dialog open={!!user}>
      <Title>更新用户{user ? `"${user.nickname}"` : ''}</Title>
      <Content>
        <Label label="账号是否可用" style={labelStyle}>
          <Select
            value={disabled}
            onChange={onDisabledChange}
            array={SELECT_LIST}
            itemRenderer={itemRenderer}
            disabled={loading}
            style={selectStyle}
            customInputDisabled
          />
        </Label>
        <Label label="备注" style={labelStyle}>
          <Textarea
            value={remark}
            onChange={onRemarkChange}
            style={textareaStyle}
            disabled={loading}
            maxLength={REMARK_MAX_LENGTH}
          />
        </Label>
      </Content>
      <Action>
        <Button label="取消" onClick={onClose} disabled={loading} />
        <Button
          label="更新"
          type={ButtonType.PRIMARY}
          onClick={onUpdate}
          loading={loading}
        />
      </Action>
    </Dialog>
  );
};

export default UpdateDialog;
