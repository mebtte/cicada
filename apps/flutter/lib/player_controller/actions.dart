import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:provider/provider.dart';
import '../audio_handler.dart';
import './playqueue.dart';
import './playlist.dart';
import '../states/audio.dart';
import '../states/playqueue.dart';

class Actions extends StatelessWidget {
  const Actions({super.key});

  @override
  Widget build(BuildContext context) {
    final playing = context.watch<AudioState>().playing;
    final spacing = SizedBox(width: 10);
    return Row(
      children: [
        spacing,
        IconButton(
          onPressed: () {
            final audioHandler = GetIt.instance.get<MyAudioHandler>();
            playing ? audioHandler.pause() : audioHandler.play();
          },
          icon: Icon(playing ? Icons.pause : Icons.play_arrow),
        ),
        spacing,
        IconButton(
          onPressed: () {
            playqueueState.next();
          },
          icon: Icon(Icons.skip_next),
        ),
        spacing,
        IconButton(
          onPressed: () {
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (context) {
                return FractionallySizedBox(
                  heightFactor: 0.8,
                  child: Container(
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.vertical(
                        top: Radius.circular(16),
                      ),
                    ),
                    child: DefaultTabController(
                      length: 2,
                      initialIndex: 1,
                      child: Column(
                        children: [
                          Container(
                            margin: const EdgeInsets.only(top: 8, bottom: 4),
                            width: 40,
                            height: 4,
                            decoration: BoxDecoration(
                              color: Colors.grey[300],
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                          const TabBar(
                            tabs: [
                              Tab(text: "播放列表"),
                              Tab(text: "播放队列"),
                            ],
                          ),
                          Expanded(
                            child: TabBarView(
                              children: [Playlist(), Playqueue()],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            );
          },
          icon: Icon(Icons.list_outlined),
        ),
        spacing,
      ],
    );
  }
}
