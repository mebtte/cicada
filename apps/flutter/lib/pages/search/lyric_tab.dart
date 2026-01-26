import 'package:cicada/event_bus.dart';
import 'package:cicada/server/api/search_lyric.dart';
import 'package:flutter/material.dart';
import 'music_with_lyric_list_item.dart';

class LyricTab extends StatefulWidget {
  final String keyword;

  const LyricTab({super.key, required this.keyword});

  @override
  State<LyricTab> createState() => _LyricTabState();
}

class _LyricTabState extends State<LyricTab> {
  bool _loading = false;
  List<MusicWithLyricSnippet> _results = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _search();
  }

  @override
  void didUpdateWidget(covariant LyricTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.keyword != widget.keyword) {
      _search();
    }
  }

  Future<void> _search() async {
    if (widget.keyword.isEmpty) {
      if (mounted) {
        setState(() {
          _results = [];
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
      final results = await searchMusicByLyric(keyword: widget.keyword);
      if (mounted) {
        setState(() {
          _results = results;
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
    if (_results.isEmpty) {
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
      itemCount: _results.length,
      itemBuilder: (context, index) {
        final item = _results[index];
        return MusicWithLyricListItem(
          music: item.music,
          snippetLines: item.snippetLines,
          keyword: widget.keyword,
          onTap: () {
            eventBus.fire(PlayMusicEvent(music: item.music));
          },
        );
      },
    );
  }
}
