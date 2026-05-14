import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import notice from '@/utils/notice';
import openCreateSingerDialog from '../open_create_singer_dialog';

const Style = styled.div`
  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: 0;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  cursor: pointer;
  ${upperCaseFirstLetter}

  &:hover {
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  }
`;

function CreateSingerLabel() {
  return (
    <Style
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        return openCreateSingerDialog({
          onCreated: () => {
            notice.info(t('created'));
          },
        });
      }}
    >
      {t('create_singer')}
    </Style>
  );
}

export default CreateSingerLabel;
