import 'package:flutter/foundation.dart';

class AudioState extends ChangeNotifier {
  bool playing = false;
  bool loading = false;

  void updateState({required bool playing, required bool loading}) {
    this.playing = playing;
    this.loading = loading;
    notifyListeners();
  }

  // Keep the old method for backward compatibility if needed, or remove it if I check all usages.
  // Usage in audio_handler.dart: audioState.updatePlaying(state.playing);
  // I will replace usage in audio_handler.dart next.
  void updatePlaying(bool p) {
    playing = p;
    notifyListeners();
  }
}

final audioState = AudioState();
