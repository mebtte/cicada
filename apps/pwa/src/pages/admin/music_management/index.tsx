import { useState } from 'react';
import styled from 'styled-components';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import capitalize from '#/utils/capitalize';
import autoScrollbar from '@/style/auto_scrollbar';
import ImportSection from './import_section';
import MusicList from './music_list';
import MusicEditDrawer from './music_edit_drawer';

const ScrollArea = styled.div`
  height: 100%;
  overflow-y: auto;
  ${autoScrollbar}
  padding: 28px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: 1200px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 10px;
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 18px 20px 16px;
  border-bottom: 1px solid ${CSSVariable.COLOR_BORDER};
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

const CardTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
`;

const CardBody = styled.div`
  padding: 20px;
`;

function MusicManagement() {
  const [editMusicId, setEditMusicId] = useState<string | null>(null);

  return (
    <ScrollArea>
      <Grid>
        <Card>
          <CardHeader>
            <CardTitle>{capitalize(t('import_music'))}</CardTitle>
          </CardHeader>
          <CardBody>
            <ImportSection />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{capitalize(t('music_management'))}</CardTitle>
          </CardHeader>
          <CardBody>
            <MusicList onEdit={setEditMusicId} />
          </CardBody>
        </Card>
      </Grid>

      <MusicEditDrawer
        open={editMusicId !== null}
        musicId={editMusicId}
        onClose={() => setEditMusicId(null)}
      />
    </ScrollArea>
  );
}

export default MusicManagement;
