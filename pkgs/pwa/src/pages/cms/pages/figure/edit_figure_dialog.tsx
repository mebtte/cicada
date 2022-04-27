import React, { useEffect, useState } from 'react';

import { NAME_MAX_LENGTH, ALIAS_MAX_LENGTH } from '@/constants/figure';
import Label from '@/components/label';
import Input from '@/components/input';
import cmsUpdateFigure, { Key } from '@/server/cms_update_figure';
import toast from '@/platform/toast';
import dialog from '@/platform/dialog';
import logger from '@/platform/logger';
import Button, { Type } from '@/components/button';
import Dialog, { Title, Content, Action } from '@/components/dialog';
import { Figure } from './constants';
import eventemitter, { EventType } from './eventemitter';

const labelStyle = {
  marginBottom: '20px',
};
const inputStyle = {
  width: '100%',
};

const EditFigureDialog = () => {
  const [figure, setFigure] = useState<Figure>(null);
  const onClose = () => setFigure(null);

  const [name, setName] = useState('');
  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setName(event.target.value);

  const [alias, setAlias] = useState('');
  const onAliasChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setAlias(event.target.value);

  const [loading, setLoading] = useState(false);
  const onUpdate = async () => {
    const trimName = name.trim();
    if (!trimName) {
      return toast.error('请输入角色名字');
    }
    setLoading(true);
    try {
      let needUpdate = false;

      if (figure.name !== trimName) {
        needUpdate = true;
        await cmsUpdateFigure({
          id: figure.id,
          key: Key.NAME,
          value: trimName,
        });
      }

      const trimAlias = alias.trim();
      if (figure.alias !== trimAlias) {
        needUpdate = true;
        await cmsUpdateFigure({
          id: figure.id,
          key: Key.ALIAS,
          value: trimAlias,
        });
      }

      if (needUpdate) {
        toast.success(`角色"${name}"已更新`);
        eventemitter.emit(EventType.FIGURE_CREATED_OR_UPDATED_OR_DELETED);
      }

      onClose();
    } catch (error) {
      logger.error(error, { description: '更新角色失败', report: true });
      dialog.alert({ title: '更新角色失败', content: error.message });
    }
    setLoading(false);
  };

  useEffect(() => {
    const openListener = (f: Figure) => {
      setFigure(f);
      setName(f.name);
      setAlias(f.alias);
    };
    eventemitter.on(EventType.OPEN_EDIT_FIGURE_DIALOG, openListener);
    return () =>
      void eventemitter.off(EventType.OPEN_EDIT_FIGURE_DIALOG, openListener);
  }, []);

  return (
    <Dialog open={!!figure}>
      <Title>{figure ? `编辑"${figure.name}"资料` : '编辑角色资料'}</Title>
      <Content>
        <Label label="名字" style={labelStyle}>
          <Input
            value={name}
            onChange={onNameChange}
            placeholder={`名字不超过 ${NAME_MAX_LENGTH} 个字符`}
            maxLength={NAME_MAX_LENGTH}
            disabled={loading}
            style={inputStyle}
          />
        </Label>
        <Label label="别名" style={labelStyle}>
          <Input
            value={alias}
            onChange={onAliasChange}
            placeholder={`别名不超过 ${ALIAS_MAX_LENGTH} 个字符`}
            maxLength={ALIAS_MAX_LENGTH}
            disabled={loading}
            style={inputStyle}
          />
        </Label>
      </Content>
      <Action>
        <Button label="取消" onClick={onClose} disabled={loading} />
        <Button
          label="更新"
          type={Type.PRIMARY}
          onClick={onUpdate}
          loading={loading}
        />
      </Action>
    </Dialog>
  );
};

export default React.memo(EditFigureDialog);
