import React, { useEffect, useState } from 'react';

import cmsUpdatePublicConfig from '@/server/cms_update_public_config';
import logger from '@/platform/logger';
import toast from '@/platform/toast';
import Label from '@/components/label';
import Input from '@/components/input';
import Textarea from '@/components/textarea';
import Button, { Type as ButtonType } from '@/components/button';
import Dialog, { Title, Content, Action } from '@/components/dialog';
import { PublicConfig } from './constants';
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

const UpdateDialog = () => {
  const [publicConfig, setPublicConfig] = useState<PublicConfig | null>(null);
  const onClose = () => setPublicConfig(null);

  const [value, setValue] = useState('');
  const onValueChange = (event: React.ChangeEvent<HTMLTextAreaElement>) =>
    setValue(event.target.value);

  const [loading, setLoading] = useState(false);
  const onUpdate = async () => {
    if (publicConfig.value === value) {
      return onClose();
    }
    setLoading(true);
    try {
      await cmsUpdatePublicConfig({ key: publicConfig.key, value });
      onClose();
      eventemitter.emit(EventType.PUBLIC_CONFIG_UPDATED);
    } catch (error) {
      logger.error(error, { description: '更新公共配置失败', report: true });
      toast.error(error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    const openListener = (pc: PublicConfig) => {
      setPublicConfig(pc);
      setValue(pc.value);
    };
    eventemitter.on(EventType.OPEN_UPDATE_DIALOG, openListener);
    return () =>
      void eventemitter.off(EventType.OPEN_UPDATE_DIALOG, openListener);
  }, []);

  return (
    <Dialog open={!!publicConfig}>
      <Title>更新公共配置</Title>
      <Content>
        <Label label="键" style={labelStyle}>
          <Input value={publicConfig?.key || ''} style={inputStyle} disabled />
        </Label>
        <Label label="描述" style={labelStyle}>
          <Input
            value={publicConfig?.description || ''}
            style={inputStyle}
            disabled
          />
        </Label>
        <Label label="值" style={labelStyle}>
          <Textarea
            value={value}
            onChange={onValueChange}
            style={textareaStyle}
            disabled={loading}
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

export default React.memo(UpdateDialog);
