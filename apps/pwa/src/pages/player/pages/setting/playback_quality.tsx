import { CSSProperties, memo, useContext } from 'react';
import { Help } from '@/components/icon';
import styled, { css } from 'styled-components';
import { Button, TabList } from '@/components';
import {
  MusicPlaybackQuality,
  type MusicPlaybackQuality as MusicPlaybackQualityValue,
} from '@/constants/setting';
import { useSetting } from '@/global_states/setting';
import { useTheme } from '@/global_states/theme';
import { t } from '@/i18n';
import dialog from '@/utils/dialog';
import playerContext from '../../context';
import Item from './item';
import { itemStyle } from './constants';

const tabListStyle: CSSProperties = {
  width: 280,
};
const miniModeTabListStyle: CSSProperties = {
  flex: '1 1 auto',
  minWidth: 0,
};
const Label = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-width: 0;

  > .text {
    min-width: 0;
  }
`;
const Control = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;

  ${({ theme: { miniMode } }) =>
    miniMode &&
    css`
      width: 100%;
    `}
`;
const HelpContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  line-height: 1.5;

  b {
    display: block;
    margin-bottom: 4px;
    text-transform: capitalize;
  }
`;

const tabList = [
  {
    tab: MusicPlaybackQuality.SOURCE,
    label: t('music_playback_quality_source'),
  },
  {
    tab: MusicPlaybackQuality.SMOOTH,
    label: t('music_playback_quality_smooth'),
  },
];

function openHelp() {
  dialog.alert({
    title: t('music_playback_quality_help_title'),
    content: (
      <HelpContent>
        <div>
          <b>{t('music_playback_quality_source')}</b>
          <span>{t('music_playback_quality_source_description')}</span>
        </div>
        <div>
          <b>{t('music_playback_quality_smooth')}</b>
          <span>{t('music_playback_quality_smooth_description')}</span>
        </div>
      </HelpContent>
    ),
  });
}

function PlaybackQuality() {
  const { musicPlaybackQuality } = useSetting();
  const { miniMode } = useTheme();
  const { playqueue, currentPlayqueuePosition } = useContext(playerContext);
  const currentMusic = playqueue[currentPlayqueuePosition];
  const onChange = (value: MusicPlaybackQualityValue) => {
    if (value === musicPlaybackQuality) return;

    const updatePlaybackQuality = () => {
      useSetting.setState({
        musicPlaybackQuality: value,
      });
    };
    if (!currentMusic) {
      updatePlaybackQuality();
      return;
    }

    dialog.confirm({
      title: t('music_playback_quality_help_title'),
      content: t('music_playback_quality_change_question'),
      onConfirm: updatePlaybackQuality,
    });
  };

  return (
    <Item
      label={
        <Label>
          <span className="text">{t('music_playback_quality')}</span>
          <Button
            square
            variant="ghost"
            size="sm"
            aria-label={t('music_playback_quality_help_title')}
            onClick={openHelp}
          >
            <Help />
          </Button>
        </Label>
      }
      style={itemStyle}
    >
      <Control>
        <TabList<MusicPlaybackQualityValue>
          current={musicPlaybackQuality}
          tabList={tabList}
          onChange={onChange}
          style={miniMode ? miniModeTabListStyle : tabListStyle}
        />
      </Control>
    </Item>
  );
}

export default memo(PlaybackQuality);
