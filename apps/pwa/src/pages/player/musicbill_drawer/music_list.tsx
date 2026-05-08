import Empty from '@/components/empty';
import { CSSProperties, useContext } from 'react';
import List from 'react-list';
import styled from 'styled-components';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import { CSS_VAR } from '@/components/theme';
import Music from '../components/music';
import { MusicWithSingerAliases } from '../constants';
import Context from '../context';

const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;
const emptyStyle: CSSProperties = {
  padding: '50px 0',
};
const ListShell = styled.div`
  padding: 12px 12px 16px;
`;
const DuoMusic = styled(Music)`
  && {
    min-height: 72px;
    margin-bottom: 10px;
    padding: 0 12px 4px;
    gap: 12px;

    position: relative;
    overflow: hidden;

    background: ${({ active }) =>
      active ? 'rgb(232 255 218)' : '#fff'} !important;
    border: 2px solid
      ${({ active }) => (active ? PRIMARY : CSSVariable.COLOR_BORDER)};
    border-radius: 16px;
    box-shadow: 0 4px 0
      ${({ active }) => (active ? PRIMARY_SHADOW : 'rgb(232 232 232)')};

    transition:
      transform 150ms ease-out,
      box-shadow 150ms ease-out,
      border-color 150ms ease-out,
      filter 120ms ease-out;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 8px;
      height: 100%;
      background: ${({ active }) => (active ? PRIMARY : 'rgb(255 184 28)')};
    }

    > .index {
      width: auto;
      height: auto;
      background: transparent;
      border: 0;
      border-radius: 0;
      color: ${({ active }) =>
        active ? PRIMARY : CSSVariable.TEXT_COLOR_SECONDARY};
      font-family: monospace;
      font-size: ${CSSVariable.TEXT_SIZE_SMALL};
      font-weight: 900;
      writing-mode: vertical-lr;
    }

    > .content {
      min-width: 0;

      > .music {
        min-height: 68px;
        gap: 12px;

        > .info {
          > .top {
            > .name {
              color: ${({ active }) =>
                active ? 'rgb(58 122 0)' : CSSVariable.TEXT_COLOR_PRIMARY};
              font-weight: 900;
            }

            > .alias {
              font-weight: 700;
            }
          }

          > .singers {
            font-weight: 700;
          }
        }

        > div:last-child {
          flex: 0 0 auto;
          gap: 6px;

          > button {
            color: ${CSSVariable.TEXT_COLOR_PRIMARY};
            background: #fff;
            border-color: rgb(210 210 210);
            border-radius: 10px;
            box-shadow: 0 3px 0 rgb(185 185 185);
            transition:
              transform 150ms ease-out,
              box-shadow 150ms ease-out,
              filter 120ms ease-out;

            &:first-child {
              color: #fff;
              background: ${PRIMARY};
              border-color: ${PRIMARY_SHADOW};
              box-shadow: 0 3px 0 ${PRIMARY_SHADOW};
            }

            &:not(:disabled):hover {
              filter: brightness(1.05);
            }

            &:not(:disabled):active {
              transform: translateY(3px);
              box-shadow: none;
              transition:
                transform 60ms ease-in,
                box-shadow 60ms ease-in,
                filter 60ms ease-in;
            }
          }
        }
      }
    }

    &:hover {
      border-color: ${({ active }) =>
        active ? PRIMARY : 'rgb(198 198 198)'};
      filter: brightness(1.02);
    }

    &:active {
      transform: translateY(4px);
      box-shadow: none;
      transition:
        transform 60ms ease-in,
        box-shadow 60ms ease-in,
        filter 60ms ease-in;
    }
  }
`;

function MusicList({ musicList }: { musicList: MusicWithSingerAliases[] }) {
  const { playqueue, currentPlayqueuePosition } = useContext(Context);
  return musicList.length ? (
    <ListShell>
      <List
        length={musicList.length}
        type="uniform"
        itemRenderer={(index, key) => {
          const music = musicList[index];
          return (
            <DuoMusic
              key={key}
              index={musicList.length - index}
              music={music}
              active={playqueue[currentPlayqueuePosition]?.id === music.id}
            />
          );
        }}
      />
    </ListShell>
  ) : (
    <Empty description={t('no_music')} style={emptyStyle} />
  );
}

export default MusicList;
