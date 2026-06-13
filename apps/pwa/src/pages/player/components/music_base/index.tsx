import FeatureMusicBase, {
  type MusicBaseProps as FeatureMusicBaseProps,
} from '@/features/music/components/music_base';
import e, { EventType } from '../../eventemitter';

type Props = Omit<
  FeatureMusicBaseProps,
  'onOpenMusic' | 'onOpenArtist'
>;

function MusicBase(props: Props) {
  return (
    <FeatureMusicBase
      {...props}
      onOpenMusic={(music) =>
        e.emit(EventType.OPEN_MUSIC_DRAWER, { id: music.id })
      }
      onOpenArtist={(performer) =>
        e.emit(EventType.OPEN_ARTIST_DRAWER, { id: performer.id })
      }
    />
  );
}

export default MusicBase;
