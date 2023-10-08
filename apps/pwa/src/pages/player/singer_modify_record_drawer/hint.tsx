import styled from 'styled-components';
import { SINGER_MODIFY_RECORD_TTL } from '#/constants';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';

const Style = styled.div`
  padding: 10px;

  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  text-align: center;
`;

function Hint() {
  return (
    <Style>
      {t(
        'save_time_of_singer_modify_record_instruction',
        (SINGER_MODIFY_RECORD_TTL / (1000 * 60 * 60 * 24)).toString(),
      )}
    </Style>
  );
}

export default Hint;
