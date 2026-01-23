import 'dart:async';
import 'package:uuid/uuid.dart';
import 'package:flutter/material.dart';
import '../../utils/get_musicbill_by_id.dart';
import '../../states/musicbill.dart' as musicbill_state;
import '../../states/route.dart';
import './bottom_toolbar.dart';
import './musicbill_header.dart';
import './status_views.dart';
import './music_list_content.dart';

const uuid = Uuid();

// 底部工具栏的高度：padding (8*2) + button height (36) = 52
const double _bottomToolbarHeight = 52.0;

class Musicbill extends StatefulWidget {
  final String id;

  const Musicbill({super.key, required this.id});

  @override
  State<Musicbill> createState() => _MusicbillState();
}

class _MusicbillState extends State<Musicbill> {
  @override
  void initState() {
    super.initState();

    // 延迟设置路由，避免在 build 期间调用 setState
    WidgetsBinding.instance.addPostFrameCallback((_) {
      routeState.setRoute('/musicbill');
    });

    final musicbill = musicbill_state.musicbillState.musicbillList.firstWhere(
      (m) => m.id == widget.id,
    );
    if (musicbill.status != musicbill_state.MusicbillStatus.LOADING) {
      Future.delayed(
        Duration.zero,
        () => musicbill_state.musicbillState.reloadMusicbill(
          id: widget.id,
          silence:
              musicbill.status == musicbill_state.MusicbillStatus.SUCCESSFUL,
        ),
      );
    }
  }

  @override
  void dispose() {
    // 延迟重置路由，避免在 build 期间调用 setState
    scheduleMicrotask(() {
      routeState.setRoute('/');
    });
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final musicbill = useMusicbillById(context, widget.id);
    final empty = musicbill.musicList.isEmpty;

    return Scaffold(
      body: Column(
        children: [
          MusicbillHeader(musicbill: musicbill),
          if (musicbill.status == musicbill_state.MusicbillStatus.LOADING &&
              empty)
            const Expanded(child: MusicbillLoadingView())
          else if (musicbill.status == musicbill_state.MusicbillStatus.FAILED &&
              empty)
            Expanded(child: MusicbillErrorView(musicbillId: widget.id))
          else if (empty)
            const Expanded(child: MusicbillEmptyView())
          else
            Expanded(
              child: MusicListContent(
                musicbill: musicbill,
                bottomToolbarHeight: _bottomToolbarHeight,
              ),
            ),
          BottomToolbar(musicbill: musicbill),
        ],
      ),
    );
  }
}
