import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import { MdAdd } from 'react-icons/md';
import Tooltip from '#/components/tooltip';
import useNavigate from '#/utils/use_navigate';
import { Query } from '@/constants';
import Filter from './filter';

const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 10px 20px;
`;

function Toolbar() {
  const navigate = useNavigate();
  const openCreateMusicDialog = () =>
    navigate({
      query: {
        [Query.CREATE_MUSIC_DIALOG_OPEN]: 1,
      },
    });
  return (
    <Style>
      <Tooltip title="创建音乐">
        <IconButton onClick={openCreateMusicDialog}>
          <MdAdd />
        </IconButton>
      </Tooltip>
      <Filter />
    </Style>
  );
}

export default Toolbar;
