import React, { useState, useEffect } from 'react';

import useMusicLrc from '@/utils/use_music_lrc';
import { RequestStatus } from '@/constants';
import cmsUdpateMusic, { Key } from '@/server/cms_update_music';
import dialog from '@/platform/dialog';
import logger from '@/platform/logger';
import ErrorCard from '@/components/error_card';
import Textarea from '@/components/textarea';
import { Title, Content, Action } from '@/components/dialog';
import Button, { Type } from '@/components/button';
import { Music } from '../constants';

const textareaStyle: React.CSSProperties = {
  width: '100%',
  height: '350px',
  resize: 'vertical',
};
const errorCardStyle: React.CSSProperties = {
  padding: '50px 0',
};

const Wrapper = ({ music, onClose }: { music: Music; onClose: () => void }) => {
  const { lrc: originalLrc, retry: getOriginalLrc } = useMusicLrc(music.id);

  const [lrc, setLrc] = useState('');
  const onLrcChange = (event: React.ChangeEvent<HTMLTextAreaElement>) =>
    setLrc(event.target.value);

  const [loading, setLoading] = useState(false);

  const onUpdate = async () => {
    // @ts-expect-error
    if (lrc === originalLrc.value) {
      return onClose();
    }
    setLoading(true);
    try {
      await cmsUdpateMusic({ id: music.id, key: Key.LRC, value: lrc });
      onClose();
    } catch (e) {
      logger.error(e, { description: '更新音乐 lrc 失败', report: true });
      dialog.alert({ title: '更新歌词失败', content: e.message });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (originalLrc.status === RequestStatus.SUCCESS) {
      setLrc(originalLrc.value);
    } else if (originalLrc.status === RequestStatus.LOADING) {
      setLrc('正在获取歌词...');
    } else {
      setLrc('');
    }
  }, [originalLrc]);

  return (
    <>
      <Title>编辑&quot;{music.name}&quot;歌词</Title>
      <Content>
        {originalLrc.status === RequestStatus.ERROR ? (
          <ErrorCard
            style={errorCardStyle}
            errorMessage={originalLrc.error.message}
            retry={getOriginalLrc}
          />
        ) : (
          <Textarea
            value={lrc}
            onChange={onLrcChange}
            placeholder="输入歌词"
            disabled={loading || originalLrc.status === RequestStatus.LOADING}
            rows={15}
            style={textareaStyle}
          />
        )}
      </Content>
      <Action>
        <Button
          label="取消"
          onClick={onClose}
          disabled={loading || originalLrc.status === RequestStatus.LOADING}
        />
        <Button
          label="更新"
          type={Type.PRIMARY}
          onClick={onUpdate}
          disabled={originalLrc.status !== RequestStatus.SUCCESS}
          loading={loading}
        />
      </Action>
    </>
  );
};

export default Wrapper;
