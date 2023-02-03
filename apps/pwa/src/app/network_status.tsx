import styled from 'styled-components';
import sm from '@/global_states/server_metadata';
import { useEffect, useState } from 'react';
import { CSSVariable } from '@/global_style';

const Style = styled.div`
  padding-block: 5px;

  font-size: 12px;
  background-color: ${CSSVariable.COLOR_DANGEROUS};
  color: #fff;
  text-align: center;
`;

function NetworkStatus() {
  const serverMetadata = sm.useState();
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

  if (serverMetadata.lastUpdateError || offline) {
    return <Style>暂时无法连接到服务, 部分功能受限</Style>;
  }
  return null;
}

export default NetworkStatus;
