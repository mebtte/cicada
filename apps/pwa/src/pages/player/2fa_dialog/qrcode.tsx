import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { QRCodeSVG } from 'qrcode.react';
import create2FA from '@/server/api/create_2fa';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';

const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;

  margin-bottom: 20px;

  > .qrcode {
    flex-shrink: 0;

    width: 100px;
    height: auto;
  }

  > .instruction {
    font-size: 14px;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};

    ${upperCaseFirstLetter}
  }
`;

function QrCode({ onClose }: { onClose: () => void }) {
  const [twoFAURI, setTwoFAURI] = useState('');

  useEffect(() => {
    create2FA()
      .then((data) => setTwoFAURI(data))
      .catch((error) => {
        logger.error(error, 'Failed to create 2FA');
        notice.error(error.message);
        onClose();
      });
  }, [onClose]);

  return (
    <Style>
      <QRCodeSVG className="qrcode" value={twoFAURI} />
      <div className="instruction">{t('2fa_instruction')}</div>
    </Style>
  );
}

export default QrCode;
