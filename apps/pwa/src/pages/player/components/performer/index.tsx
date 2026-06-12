import ArtistBase, {
  type ArtistProps as ArtistBaseProps,
} from '@/features/music/components/performer';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';

function Performer({ performer }: Pick<ArtistBaseProps, 'performer'>) {
  return (
    <ArtistBase
      performer={performer}
      onOpen={(nextArtist) =>
        playerEventemitter.emit(PlayerEventType.OPEN_ARTIST_DRAWER, {
          id: nextArtist.id,
        })
      }
    />
  );
}

export default Performer;
