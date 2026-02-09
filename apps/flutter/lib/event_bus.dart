import 'package:cicada/models/music.dart';
import 'package:event_bus/event_bus.dart';

class PlayMusicEvent {
  Music music;
  PlayMusicEvent({required this.music});
}

class AddMusicListToPlaylistEvent {
  List<Music> musicList;
  AddMusicListToPlaylistEvent({required this.musicList});
}

class InsertToPlayqueueEvent {
  List<Music> musicList;
  InsertToPlayqueueEvent({required this.musicList});
}

class PlayErrorEvent {
  final String musicName;
  final String errorMessage;
  PlayErrorEvent({required this.musicName, required this.errorMessage});
}

EventBus eventBus = EventBus();
