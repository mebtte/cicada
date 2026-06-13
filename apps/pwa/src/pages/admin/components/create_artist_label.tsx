import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import notice from '@/utils/notice';
import openCreateArtistDialog, {
  type CreatedArtist,
} from '../open_create_artist_dialog';

const Style = styled.div`
  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: 0;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  cursor: pointer;
  display: inline-flex;
  transition:
    transform 150ms ease-out,
    text-shadow 150ms ease-out;
  ${upperCaseFirstLetter}

  &:hover {
    transform: translateY(-1px);
    text-shadow: 0 2px 0 rgb(0 0 0 / 0.08);
  }
`;

function CreateArtistLabel({
  notifyOnCreated = true,
  onCreated,
}: {
  notifyOnCreated?: boolean;
  onCreated?: (artist: CreatedArtist) => void | Promise<void>;
}) {
  return (
    <Style
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        return openCreateArtistDialog({
          onCreated: async (_, artist) => {
            await onCreated?.(artist);
            if (notifyOnCreated) {
              notice.info(t('created'));
            }
          },
        });
      }}
    >
      {t('create_artist')}
    </Style>
  );
}

export default CreateArtistLabel;
