import Dialog, { Title, Content, Action } from '#/components/dialog';
import Button, { Variant } from '#/components/button';
import Input from '#/components/input';
import { ChangeEventHandler, useState } from 'react';
import Select from '#/components/select';
import styled from 'styled-components';
import { MusicType, MUSIC_TYPES, MUSIC_TYPE_MAP } from '#/constants/music';
import useOpen from './use_open';

const TYPES = MUSIC_TYPES.map((t) => ({
  id: t,
  label: MUSIC_TYPE_MAP[t].label,
}));
const StyledContent = styled(Content)`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

function CreateMusicDialog() {
  const { open, onClose } = useOpen();

  const [name, setName] = useState('');
  const onNameChange: ChangeEventHandler<HTMLInputElement> = (e) =>
    setName(e.target.value);

  const [musicType, setMusicType] = useState(MusicType.SONG);
  const onMusicTypeChange = (t: MusicType) => setMusicType(t);

  return (
    <Dialog open={open}>
      <Title>创建音乐</Title>
      <StyledContent>
        <Input
          label="名字"
          inputProps={{ value: name, onChange: onNameChange, autoFocus: true }}
        />
        <Select<MusicType>
          label="类型"
          data={TYPES}
          value={musicType}
          onChange={onMusicTypeChange}
        />
      </StyledContent>
      <Action>
        <Button onClick={onClose}>取消</Button>
        <Button variant={Variant.PRIMARY} onClick={onClose}>
          创建
        </Button>
      </Action>
    </Dialog>
  );
}

export default CreateMusicDialog;
