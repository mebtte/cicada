import 'package:cicada/event_bus.dart';
import 'package:cicada/models/music.dart';
import 'package:cicada/server/api/search_music.dart';
import 'package:flutter/material.dart';
import '../musicbill/music_list_item.dart';

class MusicTab extends StatefulWidget {
  final String keyword;

  const MusicTab({super.key, required this.keyword});

  @override
  State<MusicTab> createState() => _MusicTabState();
}

class _MusicTabState extends State<MusicTab> {
  bool _loading = false;
  List<Music> _musicList = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _search();
  }

  @override
  void didUpdateWidget(covariant MusicTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.keyword != widget.keyword) {
      _search();
    }
  }

  Future<void> _search() async {
    if (widget.keyword.isEmpty) {
      if (mounted) {
        setState(() {
          _musicList = [];
          _loading = false;
          _error = null;
        });
      }
      return;
    }

    if (mounted) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }

    try {
      final response = await searchMusic(keyword: widget.keyword);
      if (mounted) {
        setState(() {
          _musicList = response.musicList;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(child: Text('Error: $_error'));
    }
    if (_musicList.isEmpty) {
      if (widget.keyword.isEmpty) {
        return const Center(
          child: Text(
            'Type to search...',
            style: TextStyle(color: Colors.black54),
          ),
        );
      }
      return const Center(
        child: Text(
          'No results found',
          style: TextStyle(color: Colors.black54),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      itemCount: _musicList.length,
      itemBuilder: (context, index) {
        final music = _musicList[index];
        return MusicListItem(
          music: music,
          onTap: () {
            eventBus.fire(PlayMusicEvent(music: music));
          },
        );
      },
    );
  }
}
