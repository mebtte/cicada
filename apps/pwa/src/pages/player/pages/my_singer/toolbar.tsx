import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import { MdAdd } from 'react-icons/md';
import Tooltip from '#/components/tooltip';
import Input from '#/components/input';
import useNavigate from '#/utils/use_navigate';
import { Query } from '@/constants';

const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 10px 20px;

  > .filter {
    flex: 1;
    min-width: 0;
  }
`;

function Toolbar() {
  const navigate = useNavigate();
  const openCreateSingerDialog = () =>
    navigate({
      query: {
        [Query.CREATE_SINGER_DIALOG_OPEN]: 1,
      },
    });
  return (
    <Style>
      <Tooltip title="创建歌手">
        <IconButton onClick={openCreateSingerDialog}>
          <MdAdd />
        </IconButton>
      </Tooltip>
      <Input
        className="filter"
        inputProps={{
          placeholder: '查找',
        }}
      />
    </Style>
  );
}

export default Toolbar;
