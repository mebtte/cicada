import 'package:flutter/material.dart';
import '../../models/music.dart';
import './music_option_menu.dart';

void showMusicOptionMenu(
  BuildContext context, {
  required Music music,
  required VoidCallback onPlay,
  BuildContext? parentContext,
  bool showPlaylistAfterInsert = true,
}) {
  final overlay = Overlay.of(context, rootOverlay: true);
  late OverlayEntry entry;

  entry = OverlayEntry(
    builder: (_) => MusicOptionMenu(
      music: music,
      onPlay: onPlay,
      onClose: () {
        entry.remove();
      },
      parentContext: parentContext ?? context,
      showPlaylistAfterInsert: showPlaylistAfterInsert,
    ),
  );

  overlay.insert(entry);
}
