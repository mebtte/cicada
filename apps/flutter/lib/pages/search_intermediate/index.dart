import 'dart:async';
import 'package:flutter/material.dart';
import '../../server/api/get_exploration.dart';
import '../search/index.dart';
import '../../states/route.dart';
import '../../widgets/player_bottom_spacer.dart';

class SearchIntermediatePage extends StatefulWidget {
  const SearchIntermediatePage({super.key});

  @override
  State<SearchIntermediatePage> createState() => _SearchIntermediatePageState();
}

class _SearchIntermediatePageState extends State<SearchIntermediatePage> {
  bool _isLoading = true;
  String? _errorMessage;
  ExplorationData? _explorationData;
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();

  static const double _bottomToolbarHeight = 60.0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      routeState.setRoute('/search_intermediate');
    });
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    scheduleMicrotask(() {
      routeState.setRoute('/');
    });
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await getExploration();
      setState(() {
        _explorationData = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  void _onSearch() {
    final keyword = _searchController.text.trim();
    if (keyword.isNotEmpty) {
      Navigator.of(context)
          .push(
            MaterialPageRoute(
              builder: (context) => SearchPage(initialKeyword: keyword),
            ),
          )
          .then((_) {
            // 从搜索页返回时，恢复路由状态并聚焦输入框
            routeState.setRoute('/search_intermediate');
            _searchFocusNode.requestFocus();
          });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          _buildBody(),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _buildBottomToolbar(),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('加载失败: $_errorMessage'),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _loadData, child: const Text('重试')),
          ],
        ),
      );
    }

    if (_explorationData == null) {
      return const Center(child: Text('暂无数据'));
    }

    final allItems = _getAllItems();

    return SafeArea(
      bottom: false,
      child: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.only(left: 16, right: 16, top: 16),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 0.75,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) => allItems[index],
                childCount: allItems.length,
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: PlayerBottomSpacer(extraHeight: _bottomToolbarHeight),
          ),
          // 额外添加一些底部 padding，确保最后的内容不被贴底的工具栏遮挡
          // 因为 PlayerBottomSpacer 只是避让播放器的高度
          // 如果播放器不显示，BottomSpacer 是 0，但我们还有 BottomToolbar
          // 实际上 PlayerBottomSpacer 的 extraHeight 参数就是用来处理这个的
          // 但是我们需要确保即使没播放器，也要避让 BottomToolbar
          const SliverToBoxAdapter(
            child: SizedBox(height: 16), // 额外的安全间距
          ),
        ],
      ),
    );
  }

  List<Widget> _getAllItems() {
    final allItems = <Widget>[];
    final data = _explorationData!;

    for (final music in data.musicList) {
      allItems.add(_buildMusicCard(music));
    }
    for (final singer in data.singerList) {
      allItems.add(_buildSingerCard(singer));
    }
    for (final musicbill in data.publicMusicbillList) {
      allItems.add(_buildMusicbillCard(musicbill));
    }
    allItems.shuffle();
    return allItems;
  }

  Widget _buildBottomToolbar() {
    return Container(
      height: _bottomToolbarHeight + MediaQuery.of(context).padding.bottom,
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 8,
        bottom: 8 + MediaQuery.of(context).padding.bottom,
      ),
      child: Row(
        children: [
          // Back Button
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () => Navigator.pop(context),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.grey.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.arrow_back,
                  color: Colors.black87,
                  size: 24,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Search Box
          Expanded(
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(22),
              ),
              child: TextField(
                controller: _searchController,
                focusNode: _searchFocusNode,
                autofocus: true,
                decoration: InputDecoration(
                  hintText: 'Search...',
                  border: InputBorder.none,
                  prefixIcon: const Icon(Icons.search, size: 20),
                  hintStyle: const TextStyle(color: Colors.black38),
                  contentPadding: const EdgeInsets.symmetric(vertical: 10),
                ),
                style: const TextStyle(color: Colors.black87, fontSize: 16),
                textInputAction: TextInputAction.search,
                onSubmitted: (_) => _onSearch(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Cards implementation (kept same as before but extracted mostly)
  Widget _buildMusicCard(dynamic music) {
    return GestureDetector(
      onTap: () {
        // TODO: 打开音乐详情
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                color: Colors.grey[200],
              ),
              child: music.cover != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        music.cover!,
                        fit: BoxFit.cover,
                        width: double.infinity,
                        errorBuilder: (context, error, stackTrace) {
                          return const Center(
                            child: Icon(Icons.music_note, size: 48),
                          );
                        },
                      ),
                    )
                  : const Center(child: Icon(Icons.music_note, size: 48)),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            music.name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          ),
          Text(
            music.singers.map((s) => s.name).join(', '),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildSingerCard(ExplorationSinger singer) {
    return GestureDetector(
      onTap: () {
        // TODO: 打开歌手详情
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                color: Colors.grey[200],
              ),
              child: singer.avatar != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        singer.avatar!,
                        fit: BoxFit.cover,
                        width: double.infinity,
                        errorBuilder: (context, error, stackTrace) {
                          return const Center(
                            child: Icon(Icons.person, size: 48),
                          );
                        },
                      ),
                    )
                  : const Center(child: Icon(Icons.person, size: 48)),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            singer.name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          ),
          Text(
            '歌手',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildMusicbillCard(ExplorationPublicMusicbill musicbill) {
    return GestureDetector(
      onTap: () {
        // TODO: 打开歌单详情
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                color: Colors.grey[200],
              ),
              child: musicbill.cover != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        musicbill.cover!,
                        fit: BoxFit.cover,
                        width: double.infinity,
                        errorBuilder: (context, error, stackTrace) {
                          return const Center(
                            child: Icon(Icons.queue_music, size: 48),
                          );
                        },
                      ),
                    )
                  : const Center(child: Icon(Icons.queue_music, size: 48)),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            musicbill.name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          ),
          Text(
            '公共歌单',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }
}
