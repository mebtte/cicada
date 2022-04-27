import React, { useEffect, useState } from 'react';

import Checkbox from '@/components/checkbox';
import { URL } from '@/constants/regexp';
import Select from '@/components/select';
import cmsUpdateMusic, { Key } from '@/server/cms_update_music';
import toast from '@/platform/toast';
import dialog from '@/platform/dialog';
import logger from '@/platform/logger';
import Label from '@/components/label';
import Input from '@/components/input';
import Dialog, { Title, Content, Action } from '@/components/dialog';
import Button, { Type } from '@/components/button';
import {
  NAME_MAX_LENGTH,
  ALIAS_MAX_LENGTH,
  MV_LINK_MAX_LENGTH,
  MUSIC_TYPES,
  MUSIC_TYPE_MAP_LABEL,
  MusicType,
} from '@/constants/music';
import { Music } from './constants';
import eventemitter, { EventType } from './eventemitter';

const labelStyle = {
  marginBottom: 20,
};
const inputStyle = {
  width: '100%',
};
const musicTypeItemRenderer = (t: MusicType | null) => {
  if (!t) {
    return null;
  }
  return MUSIC_TYPE_MAP_LABEL[t];
};

const EditMusicDialog = () => {
  const [music, setMusic] = useState<Music | null>(null);

  const [name, setName] = useState('');
  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setName(event.target.value);

  const [type, setType] = useState(MusicType.NORMAL);
  const onTypeChange = (t: MusicType) => setType(t);

  const [recommendable, setRecommendable] = useState(false);
  const onRecommendableChange = (r: boolean) => setRecommendable(r);

  const [alias, setAlias] = useState('');
  const onAliasChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setAlias(event.target.value);

  const [mvLink, setMvLink] = useState('');
  const onMvLinkChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setMvLink(event.target.value);

  const onClose = () => setMusic(null);
  useEffect(() => {
    const openListener = (m: Music) => {
      setMusic(m);
      setName(m.name);
      setType(m.type);
      setRecommendable(m.recommendable);
      setAlias(m.alias);
      setMvLink(m.mvLink);
    };
    eventemitter.on(EventType.OPEN_EDIT_DIALOG, openListener);
    return () =>
      void eventemitter.off(EventType.OPEN_EDIT_DIALOG, openListener);
  }, []);

  const [loading, setLoading] = useState(false);
  const onUpdate = async () => {
    const trimName = name.trim();
    if (!trimName) {
      return toast.error('请输入名字');
    }

    const trimMvLink = mvLink.trim();
    if (trimMvLink && !URL.test(trimMvLink)) {
      return toast.error('MV 链接格式错误');
    }

    setLoading(true);
    try {
      let needUpdate = false;

      if (music.name !== trimName) {
        needUpdate = true;
        await cmsUpdateMusic({ id: music.id, key: Key.NAME, value: trimName });
      }

      if (music.type !== type) {
        needUpdate = true;
        await cmsUpdateMusic({
          id: music.id,
          key: Key.TYPE,
          value: type.toString(),
        });
      }

      if (music.recommendable !== recommendable) {
        needUpdate = true;
        await cmsUpdateMusic({
          id: music.id,
          key: Key.RECOMMENDABLE,
          value: recommendable ? '1' : '0',
        });
      }

      const trimAlias = alias.trim();
      if (music.alias !== trimAlias) {
        needUpdate = true;
        await cmsUpdateMusic({
          id: music.id,
          key: Key.ALIAS,
          value: trimAlias,
        });
      }

      if (music.mvLink !== trimMvLink) {
        needUpdate = true;
        await cmsUpdateMusic({
          id: music.id,
          key: Key.MV_LINK,
          value: trimMvLink,
        });
      }

      if (needUpdate) {
        eventemitter.emit(EventType.MUSIC_CREATED_OR_UPDATED_OR_DELETED);
      }

      onClose();
    } catch (error) {
      logger.error(error, { description: '更新音乐失败', report: true });
      dialog.alert({
        title: '更新音乐失败',
        content: error.message,
      });
    }
    setLoading(false);
  };

  return (
    <Dialog open={!!music}>
      <Title>{music ? `编辑"${music.name}"` : '编辑音乐'}</Title>
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
        <Label label="类型" style={labelStyle}>
          <Select
            value={type}
            onChange={onTypeChange}
            array={MUSIC_TYPES}
            itemRenderer={musicTypeItemRenderer}
            disabled={loading}
            style={inputStyle}
            customInputDisabled
          />
        </Label>
        <Label label="是否可推荐" style={labelStyle}>
          <Checkbox checked={recommendable} onChange={onRecommendableChange} />
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
        <Label label="MV 链接" style={labelStyle}>
          <Input
            value={mvLink}
            onChange={onMvLinkChange}
            placeholder={`MV 链接不超过 ${MV_LINK_MAX_LENGTH} 个字符`}
            maxLength={MV_LINK_MAX_LENGTH}
            disabled={loading}
            style={inputStyle}
          />
        </Label>
      </Content>
      <Action>
        <Button label="取消" onClick={onClose} disabled={loading} />
        <Button
          label="更新"
          onClick={onUpdate}
          type={Type.PRIMARY}
          loading={loading}
        />
      </Action>
    </Dialog>
  );
};

export default React.memo(EditMusicDialog);
