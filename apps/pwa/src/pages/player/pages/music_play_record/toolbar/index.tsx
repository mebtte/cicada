import styled from 'styled-components';
import IconButton from '@/components/icon_button';
import { MdHelpOutline } from 'react-icons/md';
import dialog from '@/utils/dialog';
import { useUser } from '@/global_states/server';
import Filter from './filter';
import { TOOLBAR_HEIGHT } from '../constants';

const Style = styled.div`
  position: absolute;
  width: 100%;
  height: ${TOOLBAR_HEIGHT}px;
  left: 0;
  bottom: 0;

  padding: 0 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  backdrop-filter: blur(5px);
`;

function Toolbar() {
  const user = useUser()!;
  return (
    <Style>
      <IconButton
        onClick={() =>
          dialog.alert({
            content: (
              <div>
                <div>
                  1. 你的音乐播放记录将
                  {user.musicPlayRecordIndate === 0
                    ? '无限期保留'
                    : `保留 ${user.musicPlayRecordIndate} 天`}
                  , 更多信息请联系管理员
                </div>
                <div>
                  2. 由于浏览器的限制,
                  有一定的概率在某些极端情况下无法保留音乐播放记录
                </div>
              </div>
            ),
            confirmText: '知道了',
          })
        }
      >
        <MdHelpOutline />
      </IconButton>
      <Filter />
    </Style>
  );
}

export default Toolbar;
