import React, { useState } from 'react';

import toast from '@/platform/toast';
import logger from '@/platform/logger';
import dialog from '@/platform/dialog';
import cmsCreateUser from '@/server/cms_create_user';
import Label from '@/components/label';
import Input from '@/components/input';
import Textarea from '@/components/textarea';
import { EMAIL } from '@/constants/regexp';
import { NICKNAME_MAX_LENGTH } from '@/constants/user';
import Button, { Type as ButtonType } from '@/components/button';
import Dialog, { Title, Content, Action } from '@/components/dialog';
import useHistory from '@/utils/use_history';
import { Query } from './constants';
import eventemitter, { EventType } from './eventemitter';

const labelStyle = {
  marginBottom: 20,
};
const inputStyle = {
  width: '100%',
};
const textareaStyle = {
  ...inputStyle,
  height: 100,
  resize: 'vertical' as 'vertical',
};

const CreateDialog = ({ open }: { open: boolean }) => {
  const history = useHistory();

  const [email, setEmail] = useState('');
  const onEmailChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setEmail(event.target.value);

  const [nickname, setNickname] = useState('');
  const onNicknameChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setNickname(event.target.value);

  const [remark, setRemark] = useState('');
  const onRemarkChange = (event: React.ChangeEvent<HTMLTextAreaElement>) =>
    setRemark(event.target.value);

  const onClose = () => {
    history.push({
      query: {
        [Query.CREATE_DIALOG_OPEN]: '',
      },
    });
    setTimeout(() => {
      setEmail('');
      setNickname('');
      setRemark('');
    }, 1000);
  };
  const [loading, setLoading] = useState(false);
  const onCreate = async () => {
    if (!email) {
      return toast.error('请输入邮箱');
    }
    if (!EMAIL.test(email)) {
      return toast.error('邮箱格式错误');
    }
    if (!nickname) {
      return toast.error('请输入昵称');
    }
    if (!remark) {
      return toast.error('请输入备注');
    }
    setLoading(true);
    try {
      await cmsCreateUser({ email, nickname, remark });
      eventemitter.emit(EventType.USER_CREATED, {});
      onClose();
    } catch (error) {
      logger.error(error, { description: '创建用户失败', report: true });
      dialog.alert({ title: '创建用户失败', content: error.message });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open || loading}>
      <Title>创建用户</Title>
      <Content>
        <Label label="邮箱" style={labelStyle}>
          <Input
            value={email}
            onChange={onEmailChange}
            style={inputStyle}
            disabled={loading}
          />
        </Label>
        <Label label="昵称" style={labelStyle}>
          <Input
            value={nickname}
            onChange={onNicknameChange}
            style={inputStyle}
            disabled={loading}
            maxLength={NICKNAME_MAX_LENGTH}
          />
        </Label>
        <Label label="备注" style={labelStyle}>
          <Textarea
            value={remark}
            onChange={onRemarkChange}
            style={textareaStyle}
            disabled={loading}
          />
        </Label>
      </Content>
      <Action>
        <Button label="取消" onClick={onClose} disabled={loading} />
        <Button
          label="创建"
          type={ButtonType.PRIMARY}
          onClick={onCreate}
          loading={loading}
        />
      </Action>
    </Dialog>
  );
};

export default CreateDialog;
