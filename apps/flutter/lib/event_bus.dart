import 'package:cicada/models/music.dart';
import 'package:event_bus/event_bus.dart';

class PlayMusicEvent {
  Music music;

  PlayMusicEvent({required this.music});
}

EventBus eventBus = EventBus();
