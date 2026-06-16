import FeatureMusicInfo, {
  type MusicInfoProps as FeatureMusicInfoProps,
} from '@/features/music/components/music_info';
import eventemitter, { EventType } from '../../eventemitter';

type Props = Omit<FeatureMusicInfoProps, 'onOpenMusic' | 'onOpenArtist'>;

function MusicInfo(props: Props) {
  return (
    <FeatureMusicInfo
      {...props}
      onOpenMusic={(musicId) =>
        eventemitter.emit(EventType.OPEN_MUSIC_DRAWER, { id: musicId })
      }
      onOpenArtist={(performer) =>
        eventemitter.emit(EventType.OPEN_ARTIST_DRAWER, { id: performer.id })
      }
    />
  );
}

export default MusicInfo;
