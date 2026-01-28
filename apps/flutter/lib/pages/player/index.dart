import 'dart:ui';
import 'package:audio_service/audio_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/music.dart';
import '../../models/lyric.dart';
import '../../server/api/get_lyric.dart';
import './lyric_view.dart';
import './player_controls.dart';
import './player_header.dart';
import '../../states/playqueue.dart';
import '../../player_controller/show_playlist_dialog.dart';

class PlayerDetailPage extends StatefulWidget {
  const PlayerDetailPage({super.key});

  @override
  State<PlayerDetailPage> createState() => _PlayerDetailPageState();
}

class _PlayerDetailPageState extends State<PlayerDetailPage> {
  Music? _currentMusic;
  List<LyricLine> _lyrics = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final music = context.read<PlayqueueState>().currentMusic?.music;
      if (music != null) {
        _updateMusic(music);
      }
    });
  }

  void _updateMusic(Music music) {
    if (_currentMusic?.id == music.id) return;

    setState(() {
      _currentMusic = music;
      _lyrics = [];
    });

    _loadLyric(music.id);
  }

  Future<void> _loadLyric(String id) async {
    try {
      final lrc = await getLyric(id: id);
      if (mounted && _currentMusic?.id == id) {
        setState(() {
          _lyrics = LyricParser.parse(lrc);
        });
      }
    } catch (e) {
      if (mounted && _currentMusic?.id == id) {
        setState(() {
          // Optionally show error or empty lyrics
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Only listen to currentMusic changes to avoid unnecessary rebuilds form other playqueue changes
    final currentMusic = context.select<PlayqueueState, Music?>(
      (s) => s.currentMusic?.music,
    );

    if (currentMusic != null && _currentMusic?.id != currentMusic.id) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _updateMusic(currentMusic);
      });
    }

    if (currentMusic == null) {
      return const SizedBox.shrink();
    }

    final displayMusic = currentMusic;
    // AudioHandler is a singleton/service, it doesn't notify changes itself (streams do)
    // So we use read() to avoid rebuilding if it were to notify (which it shouldn't, but safe is better)
    final audioHandler = context.read<AudioHandler>();

    return Scaffold(
      body: Stack(
        children: [
          // Background Image and Blur
          _PlayerBackground(coverUrl: displayMusic.cover),

          // Content
          Column(
            children: [
              PlayerHeader(music: displayMusic),

              // Lyrics Area
              Expanded(
                child: StreamBuilder<Duration>(
                  stream: Stream.periodic(
                    const Duration(milliseconds: 100),
                    (_) => (audioHandler as dynamic).player.position,
                  ),
                  builder: (context, positionSnapshot) {
                    final position = positionSnapshot.data ?? Duration.zero;

                    return LyricView(
                      lyrics: _lyrics,
                      currentPosition: position,
                      onTap: () {
                        // Tap to toggle controls visibility? for now do nothing or standard
                      },
                    );
                  },
                ),
              ),

              // Controls Area
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 48),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const ProgressBar(),
                    const SizedBox(height: 32),
                    PlayerControls(
                      onBack: () => Navigator.of(context).pop(),
                      onPlaylist: () => showPlaylistDialog(context),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PlayerBackground extends StatelessWidget {
  final String? coverUrl;

  const _PlayerBackground({this.coverUrl});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 500),
            switchInCurve: Curves.easeIn,
            switchOutCurve: Curves.easeOut,
            child: coverUrl != null
                ? Image.network(
                    coverUrl!,
                    key: ValueKey(coverUrl),
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      key: const ValueKey('error'),
                      color: Colors.grey[900],
                    ),
                  )
                : Container(
                    key: const ValueKey('default'),
                    color: Colors.grey[900],
                  ),
          ),
        ),

        Positioned.fill(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
            child: Container(color: Colors.black.withValues(alpha: 0.5)),
          ),
        ),
      ],
    );
  }
}
