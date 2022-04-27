import React, { useState } from 'react';
import styled from 'styled-components';

import Checkbox from '@/components/checkbox';
import useHistory from '@/utils/use_history';
import Select from '@/components/select';
import cmsCreateMusic from '@/server/cms_create_music';
import toast from '@/platform/toast';
import dialog from '@/platform/dialog';
import logger from '@/platform/logger';
import selectFile from '@/utils/select_file';
import {
  MusicType,
  MUSIC_TYPES,
  MUSIC_TYPE_MAP_LABEL,
  NAME_MAX_LENGTH,
  MUSIC_SQ,
} from '@/constants/music';
import Label from '@/components/label';
import Input from '@/components/input';
import Dialog, { Title, Content, Action } from '@/components/dialog';
import Button, { Type } from '@/components/button';
import { Figure, Query } from './constants';
import SingerListSelector from './singer_list_selector';
import eventemitter, { EventType } from './eventemitter';

const musicTypeItemRenderer = (musicType: MusicType | null) => {
  if (!musicType) {
    return null;
  }
  return MUSIC_TYPE_MAP_LABEL[musicType];
};
const FileBox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  input {
    flex: 1;
    min-width: 0;
  }
`;
const labelStyle = {
  marginBottom: 20,
};
const inputStyle = {
  width: '100%',
};

const CreateMusicDialog = ({ open }: { open: boolean }) => {
  const history = useHistory();

  const [singerList, setSingerList] = useState<Figure[]>([]);
  const onSingerSelect = (singer: Figure) =>
    setSingerList((sl) => {
      const exist = sl.find((s) => s.id === singer.id);
      if (exist) {
        return sl;
      }
      return [...sl, singer];
    });
  const onSingerRemove = (singer: Figure) =>
    setSingerList((sl) => sl.filter((s) => s.id !== singer.id));

  const [name, setName] = useState('');
  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setName(event.target.value);

  const [musicType, setMusicType] = useState<MusicType>(MusicType.NORMAL);
  const onMusicTypeChange = (t: MusicType) => setMusicType(t);

  const [recommendable, setRecommendable] = useState(false);
  const onRecommendableChange = (r: boolean) => setRecommendable(r);

  const [sq, setSq] = useState<File | null>(null);
  const onSelectSq = () =>
    selectFile({
      acceptTypes: MUSIC_SQ.ACCEPT_MIMES,
      onSelect: (f) => {
        if (!MUSIC_SQ.ACCEPT_MIMES.includes(f.type)) {
          return toast.error(
            `标准音质支持的文件类型为 ${MUSIC_SQ.ACCEPT_MIMES.join(',')}`,
          );
        }
        if (f.size > MUSIC_SQ.MAX_SIZE) {
          return toast.error(
            `文件过大, 最大不超过 ${MUSIC_SQ.MAX_SIZE / 1024 / 1024}MB`,
          );
        }
        return setSq(f);
      },
    });

  const onClose = () => {
    history.push({
      query: {
        [Query.CREATE_DIALOG_OPEN]: '',
      },
    });
    setTimeout(() => {
      setSingerList([]);
      setName('');
      setSq(null);
    }, 1000);
  };

  const [loading, setLoading] = useState(false);
  const onCreate = async () => {
    if (!singerList.length) {
      return toast.error('请选择歌手列表');
    }
    if (!name) {
      return toast.error('请输入音乐名字');
    }
    if (!sq) {
      return toast.error('请选择标准音质');
    }
    setLoading(true);
    try {
      await cmsCreateMusic({
        singerIdList: singerList.map((s) => s.id),
        name,
        type: musicType,
        sq,
        recommendable,
      });
      toast.success(`音乐"${name}"已创建`);
      eventemitter.emit(EventType.MUSIC_CREATED_OR_UPDATED_OR_DELETED);
      onClose();
    } catch (error) {
      logger.error(error, { description: '创建音乐失败', report: true });
      dialog.alert({ title: '创建音乐失败', content: error.message });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open || loading}>
      <Title>创建音乐</Title>
      <Content>
        <SingerListSelector
          style={labelStyle}
          singerList={singerList}
          onSingerSelect={onSingerSelect}
          onSingerRemove={onSingerRemove}
          disabled={loading}
        />
        <Label label="音乐名" style={labelStyle}>
          <Input
            value={name}
            onChange={onNameChange}
            placeholder={`最长不超过 ${NAME_MAX_LENGTH} 个字符`}
            maxLength={NAME_MAX_LENGTH}
            disabled={loading}
            style={inputStyle}
          />
        </Label>
        <Label label="音乐类型" style={labelStyle}>
          <Select
            value={musicType}
            onChange={onMusicTypeChange}
            array={MUSIC_TYPES}
            itemRenderer={musicTypeItemRenderer}
            disabled={loading}
            customInputDisabled
          />
        </Label>
        <Label label="是否可推荐" style={labelStyle}>
          <Checkbox checked={recommendable} onChange={onRecommendableChange} />
        </Label>
        <Label label="标准音质" style={labelStyle}>
          <FileBox>
            <Button
              label="选取文件"
              type={Type.PRIMARY}
              onClick={onSelectSq}
              disabled={loading}
            />
            {sq ? <Input value={sq.name} readOnly /> : null}
          </FileBox>
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

export default React.memo(CreateMusicDialog);
