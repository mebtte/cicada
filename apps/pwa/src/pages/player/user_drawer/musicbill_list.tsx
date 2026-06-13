import styled from 'styled-components';
import Empty from '@/components/empty';
import { CSSProperties } from 'react';
import { t } from '@/i18n';
import getResizedImage from '@/server/asset/get_resized_image';
import Musicbill from '../pages/search/public_musicbill/musicbill';
import { UserDetail } from './constants';

type MusicbillType = UserDetail['musicbillList'][0];

const COVER_IMAGE_SIZE = 96;

const Root = styled.div`
  padding: 18px 18px calc(22px + env(safe-area-inset-bottom, 0));

  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (max-width: 420px) {
    padding-inline: 14px;
  }
`;
const emptyStyle: CSSProperties = {
  padding: '50px 0',
};

function MusicbillList({
  musicbillList,
}: {
  musicbillList: MusicbillType[];
}) {
  if (musicbillList.length) {
    return (
      <Root>
        {musicbillList.map((musicbill) => (
          <Musicbill
            key={musicbill.id}
            id={musicbill.id}
            cover={getResizedImage({
              url: musicbill.cover,
              size: Math.ceil(COVER_IMAGE_SIZE * window.devicePixelRatio),
            })}
            name={musicbill.name}
            musicCount={musicbill.musicCount}
          />
        ))}
      </Root>
    );
  }
  return <Empty style={emptyStyle} description={t('no_public_musicbill')} />;
}

export default MusicbillList;
