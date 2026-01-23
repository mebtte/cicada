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
  late ScrollController _scrollController;
  bool _showTitle = false;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _scrollController.addListener(_onScroll);

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

  void _onScroll() {
    if (!mounted) return;
    // Header 宽高比为 1.6
    final headerHeight = MediaQuery.of(context).size.width / 1.6;
    // 当滚动超过 Header 高度的一半时显示标题，或者完全滚出时
    // 这里设定为 Header 底部接近 Toolbar 底部时
    final triggerOffset =
        headerHeight - kToolbarHeight - MediaQuery.of(context).padding.top;

    if (_scrollController.hasClients) {
      if (_scrollController.offset > triggerOffset) {
        if (!_showTitle) setState(() => _showTitle = true);
      } else {
        if (_showTitle) setState(() => _showTitle = false);
      }
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
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

    final headerHeight = MediaQuery.of(context).size.width;

    return Scaffold(
      body: Stack(
        children: [
          CustomScrollView(
            controller: _scrollController,
            slivers: [
              SliverAppBar(
                expandedHeight: headerHeight,
                toolbarHeight: 0,
                collapsedHeight: 0,
                pinned: false,
                stretch: true,
                backgroundColor: Colors.transparent,
                automaticallyImplyLeading: false,
                flexibleSpace: FlexibleSpaceBar(
                  background: MusicbillHeader(musicbill: musicbill),
                  stretchModes: const [StretchMode.zoomBackground],
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 16)),
              if (musicbill.status == musicbill_state.MusicbillStatus.LOADING &&
                  empty)
                const SliverFillRemaining(child: MusicbillLoadingView())
              else if (musicbill.status ==
                      musicbill_state.MusicbillStatus.FAILED &&
                  empty)
                SliverFillRemaining(
                  child: MusicbillErrorView(musicbillId: widget.id),
                )
              else if (empty)
                const SliverFillRemaining(child: MusicbillEmptyView())
              else
                MusicListContent(
                  musicbill: musicbill,
                  bottomToolbarHeight: _bottomToolbarHeight,
                ),
            ],
          ),

          // 顶部 AppBar (仅标题)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              color: _showTitle ? Colors.white : Colors.transparent,
              child: SafeArea(
                bottom: false,
                child: SizedBox(
                  height: kToolbarHeight,
                  child: Center(
                    child: AnimatedOpacity(
                      opacity: _showTitle ? 1.0 : 0.0,
                      duration: const Duration(milliseconds: 200),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (musicbill.cover != null &&
                              musicbill.cover!.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: Image.network(
                                  musicbill.cover!,
                                  width: 20,
                                  height: 20,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) =>
                                      const SizedBox(),
                                ),
                              ),
                            ),
                          Flexible(
                            child: Text(
                              musicbill.name,
                              style: const TextStyle(
                                color: Colors.black,
                                fontSize: 17,
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),

          // 底部工具栏
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: BottomToolbar(musicbill: musicbill),
          ),
        ],
      ),
    );
  }
}
