import 'package:flutter/material.dart';
import './playlist.dart';
import './playqueue.dart';

// 记录上次打开的 tab 索引，默认为 1 (Playqueue)
int _lastTabIndex = 1;

/// 显示播放列表/队列弹窗
/// [initialTabIndex] 指定初始 tab，如果不指定则使用上次打开的 tab
void showPlaylistDialog(BuildContext context, {int? initialTabIndex}) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useRootNavigator: true, // 确保弹窗显示在播放控制器之上
    backgroundColor: Colors.transparent,
    builder: (context) {
      return FractionallySizedBox(
        heightFactor: 0.8,
        child: Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
          ),
          child: _PlaylistDialogContent(
            initialIndex: initialTabIndex ?? _lastTabIndex,
          ),
        ),
      );
    },
  );
}

class _PlaylistDialogContent extends StatefulWidget {
  final int initialIndex;

  const _PlaylistDialogContent({required this.initialIndex});

  @override
  State<_PlaylistDialogContent> createState() => _PlaylistDialogContentState();
}

class _PlaylistDialogContentState extends State<_PlaylistDialogContent>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 2,
      vsync: this,
      initialIndex: widget.initialIndex,
    );
    _tabController.addListener(_handleTabSelection);
  }

  void _handleTabSelection() {
    //而在 Android 或者其它平台，滑动切换 Tab 时，indexIsChanging 也是 true。
    // 这里我们只需要最终选中的 index
    if (!_tabController.indexIsChanging) {
      _lastTabIndex = _tabController.index;
    } else {
      // 点击 TabBar 切换时 indexIsChanging 为 true，但也应该记录？
      // 实际上 TabController.index 在动画开始时就会更新为目标 index
      _lastTabIndex = _tabController.index;
    }
  }

  @override
  void dispose() {
    _tabController.removeListener(_handleTabSelection);
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
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
        TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: "Playlist"),
            Tab(text: "Playqueue"),
          ],
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [const Playlist(), const Playqueue()],
          ),
        ),
      ],
    );
  }
}
