import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { ORIGIN } from '@/constants/regexp';
import scrollbarAsNeeded from '@/style/scrollbar_as_needed';
import Input from '@/components/input';
import dialog from '@/platform/dialog';
import logger from '@/platform/logger';
import {
  relaunch,
  setPWAOrigin as setPWAOriginRequest,
} from '@/platform/electron_new';
import PageContainer from '../page_container';
import Header from './header';
import Action from './action';
import { HEADER_HEIGHT, ACTION_HEIGHT } from './constant';

const Style = styled(PageContainer)`
  ${scrollbarAsNeeded}
  overflow: auto;
  box-sizing: border-box;
  padding: ${HEADER_HEIGHT}px 0 ${ACTION_HEIGHT}px 0;
  background-color: rgba(0, 0, 0, 0.02);
  > .part {
    margin: 20px 0;
    display: flex;
    align-items: center;
    padding: 20px 30px;
    border-radius: 2px;
    background-color: #fff;
    > .label {
      font-size: 12px;
    }
    > .value-wrapper {
      flex: 1;
      text-align: right;
      > .value {
        width: 220px;
        text-align: right;
      }
    }
  }
`;

const Content = ({ pwaOrigin: initialPwaOrigin }: { pwaOrigin: string }) => {
  const [pwaOrigin, setPwaOrigin] = useState(initialPwaOrigin);
  const onPwaOriginChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setPwaOrigin(event.target.value),
    [],
  );

  const [loading, setLoading] = useState(false);
  const onSave = () =>
    dialog.confirm({
      title: '警告',
      content: '保存配置将会重启客户端, 是否继续?',
      onConfirm: async () => {
        setLoading(true);
        try {
          if (pwaOrigin !== initialPwaOrigin) {
            if (!ORIGIN.test(pwaOrigin)) {
              throw new Error('PWA Origin 校验失败');
            } else {
              await setPWAOriginRequest({ pwaOrigin });
            }
          }
          setTimeout(() => relaunch(), 0);
        } catch (error) {
          logger.error(error, {
            description: '保存桌面客户端配置失败',
            report: true,
          });
          dialog.alert({
            title: '保存配置失败',
            content: error.message,
          });
        }
        setLoading(false);
      },
    });

  return (
    <Style>
      <Header />
      <div className="part">
        <div className="label">PWA Origin</div>
        <div className="value-wrapper">
          <Input
            className="value"
            value={pwaOrigin}
            onChange={onPwaOriginChange}
            disabled={loading}
          />
        </div>
      </div>
      <Action loading={loading} onSave={onSave} />
    </Style>
  );
};

export default Content;
