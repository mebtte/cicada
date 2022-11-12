import Container from './container';
import Singer from '../../components/singer';
import { Music as MusicType } from '../../constants';
import eventemitter, { EventType } from '../../eventemitter';

function MusicInfo({
  music,
  ...props
}: {
  music: MusicType;
  [key: string]: unknown;
}) {
  const onView = () =>
    eventemitter.emit(EventType.OPEN_MUSIC_DRAWER, { id: music.id });
  const { name, singers } = music;
  return (
    <Container {...props}>
      <div className="text">
        <span className="name" onClick={onView}>
          {name}
        </span>
        <span className="singers">
          {singers.map((s) => (
            <Singer key={s.id} singer={s} />
          ))}
        </span>
      </div>
    </Container>
  );
}

export default MusicInfo;
