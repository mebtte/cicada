import 'package:cicada/model/music.dart';
import 'package:cicada/states/playlist.dart';
import 'package:event_bus/event_bus.dart';

class PlayMusicEvent {
  Music music;

  PlayMusicEvent({required this.music});
}

EventBus eventBus = EventBus();

void initializeListeners() {
  eventBus.on<PlayMusicEvent>().listen((event) {
    playlistState.addMusicList([event.music]);
  });
}
