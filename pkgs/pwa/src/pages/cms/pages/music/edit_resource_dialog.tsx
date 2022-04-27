import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import dialog from '@/platform/dialog';
import cmsUpdateMusic from '@/server/cms_update_music';
import logger from '@/platform/logger';
import toast from '@/platform/toast';
import selectFile from '@/utils/select_file';
import { MUSIC_SQ, MUSIC_HQ, MUSIC_AC } from '@/constants/music';
import Button, { Type as ButtonType } from '@/components/button';
import Dialog, { Title, Content, Action } from '@/components/dialog';
import Input from '@/components/input';
import Label from '@/components/label';
import { Music, EditMusicResourceType } from './constants';
import eventemitter, { EventType } from './eventemitter';

const TYPE_MAP: Record<
  EditMusicResourceType,
  {
    label: string;
    mimes: string[];
    maxSize: number;
  }
> = {
  [EditMusicResourceType.SQ]: {
    label: '标准音质',
    mimes: MUSIC_SQ.ACCEPT_MIMES,
    maxSize: MUSIC_SQ.MAX_SIZE,
  },
  [EditMusicResourceType.HQ]: {
    label: '无损音质',
    mimes: MUSIC_HQ.ACCEPT_MIMES,
    maxSize: MUSIC_HQ.MAX_SIZE,
  },
  [EditMusicResourceType.AC]: {
    label: '伴奏',
    mimes: MUSIC_AC.ACCEPT_MIMES,
    maxSize: MUSIC_AC.MAX_SIZE,
  },
};
const inputStyle = {
  width: '100%',
};
const labelStyle = {
  marginBottom: 20,
};
const Original = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  > .input {
    flex: 1;
  }
`;

const EditMusicResourceDialog = () => {
  const [music, setMusic] = useState<Music>(null);
  const [type, setType] = useState(EditMusicResourceType.SQ);
  const [original, setOriginal] = useState('');
  const { label, mimes, maxSize } = TYPE_MAP[type];

  const [file, setFile] = useState<File | null>(null);
  const onSelectFile = () =>
    selectFile({
      acceptTypes: mimes,
      onSelect: (f) => {
        if (
          type === EditMusicResourceType.SQ &&
          !MUSIC_SQ.ACCEPT_MIMES.includes(f.type)
        ) {
          return toast.error(
            `不支持的文件类型, 支持的文件类型为 ${mimes.join(',')}`,
          );
        }
        if (
          type === EditMusicResourceType.HQ &&
          !MUSIC_HQ.ACCEPT_MIMES.includes(f.type)
        ) {
          return toast.error(
            `不支持的文件类型, 支持的文件类型为 ${mimes.join(',')}`,
          );
        }
        if (
          type === EditMusicResourceType.AC &&
          !MUSIC_AC.ACCEPT_MIMES.includes(f.type)
        ) {
          return toast.error(
            `不支持的文件类型, 支持的文件类型为 ${mimes.join(',')}`,
          );
        }
        if (f.size > maxSize) {
          return toast.error(`文件过大, 最大不超过 ${maxSize / 1024 / 1024}MB`);
        }
        return setFile(f);
      },
    });

  const onClose = () => {
    setMusic(null);
    setTimeout(() => {
      setFile(null);
      setOriginal('');
    }, 1000);
  };

  const [loading, setLoading] = useState(false);
  const onUpdate = async () => {
    if (!file) {
      return toast.error('请选择资源文件');
    }
    setLoading(true);
    try {
      // @ts-expect-error
      await cmsUpdateMusic({ id: music.id, key: type, value: file });
      onClose();
      eventemitter.emit(EventType.MUSIC_CREATED_OR_UPDATED_OR_DELETED);
    } catch (error) {
      logger.error(error, { description: '更新音乐资源失败', report: true });
      dialog.alert({ title: `更新${label}失败`, content: error.message });
    }
    setLoading(false);
  };

  useEffect(() => {
    const openListener = ({
      music: m,
      type: t,
    }: {
      music: Music;
      type: EditMusicResourceType;
    }) => {
      setMusic(m);
      setType(t);
      setOriginal(m[t] || '');
    };
    eventemitter.on(EventType.OPEN_EDIT_RESOURCE_DIALOG, openListener);
    return () =>
      void eventemitter.off(EventType.OPEN_EDIT_RESOURCE_DIALOG, openListener);
  }, []);

  return (
    <Dialog open={!!music}>
      <Title>
        编辑{music ? `"${music.name}"` : '音乐'}
        {label}
      </Title>
      <Content>
        {original ? (
          <Label label={`原${label}`} style={labelStyle}>
            <Original>
              <Input className="input" readOnly value={original} />
              <Button
                type={ButtonType.PRIMARY}
                label="新页面打开"
                onClick={() => window.open(original)}
              />
            </Original>
          </Label>
        ) : null}
        {file ? (
          <Label label="选择文件" style={labelStyle}>
            <Input style={inputStyle} readOnly value={file.name} />
          </Label>
        ) : null}
      </Content>
      <Action>
        <div className="left">
          <Button
            label="选择文件"
            type={ButtonType.PRIMARY}
            onClick={onSelectFile}
            disabled={loading}
          />
        </div>
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

export default EditMusicResourceDialog;
