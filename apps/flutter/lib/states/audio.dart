import 'package:flutter/foundation.dart';

class AudioState extends ChangeNotifier {
  bool playing = false;

  void updatePlaying(bool p) {
    playing = p;
    notifyListeners();
  }
}

final audioState = AudioState();
