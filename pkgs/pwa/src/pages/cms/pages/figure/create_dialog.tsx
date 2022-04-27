import React, { useState } from 'react';

import useHistory from '@/utils/use_history';
import cmsCreateFigure from '@/server/cms_create_figure';
import logger from '@/platform/logger';
import dialog from '@/platform/dialog';
import toast from '@/platform/toast';
import { NAME_MAX_LENGTH } from '@/constants/figure';
import Button, { Type } from '@/components/button';
import Label from '@/components/label';
import Input from '@/components/input';
import Dialog, { Title, Content, Action } from '@/components/dialog';
import eventemitter, { EventType } from './eventemitter';
import { Query } from './constants';

const inputStyle = {
  width: '100%',
};

const CreateFigureDialog = ({ open }: { open: boolean }) => {
  const history = useHistory();

  const [name, setName] = useState('');
  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setName(event.target.value);

  const onClose = () => {
    history.push({
      query: {
        [Query.CREATE_DIALOG_OPEN]: '',
      },
    });
    setTimeout(() => setName(''), 1000);
  };

  const [loading, setLoading] = useState(false);
  const onCreate = async () => {
    if (!name) {
      return toast.error('请输入角色名字');
    }
    setLoading(true);
    try {
      await cmsCreateFigure(name);
      toast.success(`角色"${name}"已创建`);
      onClose();
      eventemitter.emit(EventType.FIGURE_CREATED_OR_UPDATED_OR_DELETED);
    } catch (error) {
      logger.error(error, { description: '创建角色失败' });
      dialog.alert({ title: '创建角色失败', content: error.message });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open || loading}>
      <Title>创建角色</Title>
      <Content>
        <Label label="角色名字">
          <Input
            value={name}
            onChange={onNameChange}
            placeholder={`角色名字不超过 ${NAME_MAX_LENGTH} 个字符`}
            maxLength={NAME_MAX_LENGTH}
            style={inputStyle}
          />
        </Label>
      </Content>
      <Action>
        <Button label="取消" onClick={onClose} disabled={loading} />
        <Button
          label="创建"
          type={Type.PRIMARY}
          onClick={onCreate}
          loading={loading}
        />
      </Action>
    </Dialog>
  );
};

export default React.memo(CreateFigureDialog);
