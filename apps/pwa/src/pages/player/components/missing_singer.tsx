import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import { t } from '@/i18n';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import getSinger from '@/server/api/get_singer';
import notice from '@/utils/notice';
import { openCreateSingerDialog } from '../utils';

const Style = styled.div`
  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  cursor: pointer;

  ${upperCaseFirstLetter}
`;

function MissingSinger({
  afterCreating,
}: {
  afterCreating?: (singer: {
    id: string;
    name: string;
    aliases: string[];
  }) => void;
}) {
  return (
    <Style
      onClick={() =>
        openCreateSingerDialog(
          afterCreating
            ? (id) =>
                getSinger(id).then((s) =>
                  afterCreating({
                    id: s.id,
                    name: s.name,
                    aliases: s.aliases,
                  }),
                )
            : () => notice.info(t('created')),
        )
      }
    >
      {t('create_singer')}
    </Style>
  );
}

export default MissingSinger;
