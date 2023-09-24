import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { CSSVariable } from '@/global_style';
import useTitlebarAreaRect from '@/utils/use_titlebar_area_rect';
import { flexCenter } from '@/style/flexbox';
import useWindowWidth from '@/utils/use_window_width';
import globalEventemitter, {
  EventType as GlobalEventType,
} from '@/platform/global_eventemitter';

const Style = styled.div`
  ${flexCenter}

  font-size: 12px;
  background-color: ${CSSVariable.COLOR_DANGEROUS};
  color: #fff;
  white-space: nowrap;
  -webkit-app-region: drag;
`;

function NetworkStatus() {
  const windowWidth = useWindowWidth();
  const { height, left, right } = useTitlebarAreaRect();

  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    const unlistenFail = globalEventemitter.listen(
      GlobalEventType.FETCH_SERVER_METADATA_FAILED,
      () => setNetworkError(true),
    );
    const unlistenSucceeded = globalEventemitter.listen(
      GlobalEventType.FETCH_SERVER_METADATA_SUCCEEDED,
      () => setNetworkError(false),
    );
    return () => {
      unlistenFail();
      unlistenSucceeded();
    };
  }, []);

  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (networkError || offline) {
    return (
      <Style
        style={{
          height: height || 30,
          paddingLeft: left,
          paddingRight: right ? windowWidth - right : 0,
        }}
      >
        暂时无法连接到服务, 部分功能受限
      </Style>
    );
  }
  return null;
}

export default NetworkStatus;