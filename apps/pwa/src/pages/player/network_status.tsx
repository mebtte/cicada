import styled, { keyframes } from 'styled-components';
import { MdCloudOff } from 'react-icons/md';
import { CSSVariable } from '@/global_style';
import useTitlebarAreaRect from '@/utils/use_titlebar_area_rect';
import useWindowWidth from '@/utils/use_window_width';
import { t } from '@/i18n';
import { useServerMetadataStatus } from '@/global_states/server';
import { useIsOnline } from '@/utils/use_is_online';

const NETWORK_STATUS_HEIGHT = 40;
const NETWORK_STATUS_HORIZONTAL_PADDING = 12;
const DANGER_SHADOW = 'rgb(190 46 34)';

const popIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const Style = styled.div`
  position: relative;
  z-index: 2;

  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 4px 12px;

  color: #fff;
  background: ${CSSVariable.COLOR_DANGEROUS};
  border-bottom: 2px solid ${DANGER_SHADOW};
  box-shadow: 0 4px 0 ${DANGER_SHADOW};
  animation: ${popIn} 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
  -webkit-app-region: drag;

  > .network-status-banner {
    min-width: 0;
    width: 100%;
    height: 100%;
    padding: 0 16px;

    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0;
    text-transform: capitalize;
    white-space: nowrap;
  }

  > .network-status-banner > .icon {
    flex: 0 0 auto;
    width: 20px;
    height: 20px;

    display: flex;
    align-items: center;
    justify-content: center;

    font-size: 20px;
    line-height: 1;
  }

  > .network-status-banner > .text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 480px) {
    > .network-status-banner {
      padding-right: 12px;
      padding-left: 12px;
      font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    }
  }
`;

function NetworkStatus() {
  const windowWidth = useWindowWidth();
  const { height, left, right } = useTitlebarAreaRect();
  const { error } = useServerMetadataStatus();
  const online = useIsOnline();

  if (error || !online) {
    return (
      <Style
        style={{
          height: Math.max(height || 0, NETWORK_STATUS_HEIGHT),
          paddingLeft: Math.max(left, NETWORK_STATUS_HORIZONTAL_PADDING),
          paddingRight: Math.max(
            right ? windowWidth - right : 0,
            NETWORK_STATUS_HORIZONTAL_PADDING,
          ),
        }}
      >
        <div className="network-status-banner">
          <span className="icon">
            <MdCloudOff />
          </span>
          <span className="text">
            {t('can_not_connect_to_server_temporarily')}
          </span>
        </div>
      </Style>
    );
  }
  return null;
}

export default NetworkStatus;
