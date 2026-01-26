import 'dart:async';
import 'package:flutter/material.dart';
import '../../states/route.dart';
import '../../player_controller/player_controller.dart';

class SearchPage extends StatefulWidget {
  const SearchPage({super.key});

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage>
    with SingleTickerProviderStateMixin {
  late final TextEditingController _textController;
  late final TabController _tabController;

  final List<String> _tabs = ['Music', 'Singer', 'Lyric', 'Playlist'];
  static const double _bottomToolbarHeight = 60.0;

  @override
  void initState() {
    super.initState();
    _textController = TextEditingController();
    _tabController = TabController(length: _tabs.length, vsync: this);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      routeState.setRoute('/search');
    });
  }

  @override
  void dispose() {
    _textController.dispose();
    _tabController.dispose();
    scheduleMicrotask(() {
      routeState.setRoute('/');
    });
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // 底部工具栏 + 播放器高度 + 安全区域
    final bottomPadding =
        _bottomToolbarHeight +
        PlayController.kTotalHeight +
        MediaQuery.of(context).padding.bottom;

    return Scaffold(
      body: Stack(
        children: [
          Column(
            children: [
              // Top TabBar
              SafeArea(
                child: TabBar(
                  controller: _tabController,
                  labelColor: Theme.of(context).primaryColor,
                  unselectedLabelColor: Colors.black54,
                  indicatorColor: Theme.of(context).primaryColor,
                  labelStyle: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                  tabs: _tabs.map((t) => Tab(text: t)).toList(),
                ),
              ),
              // Content
              Expanded(
                child: Padding(
                  padding: EdgeInsets.only(bottom: bottomPadding),
                  child: TabBarView(
                    controller: _tabController,
                    children: _tabs.map((t) {
                      return ListView.builder(
                        padding: EdgeInsets.zero,
                        itemCount: 20,
                        itemBuilder: (context, index) {
                          return ListTile(title: Text('Result $index for $t'));
                        },
                      );
                    }).toList(),
                  ),
                ),
              ),
            ],
          ),

          // Bottom Toolbar (Back + Search)
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              height:
                  _bottomToolbarHeight + MediaQuery.of(context).padding.bottom,
              padding: EdgeInsets.fromLTRB(
                16,
                8,
                16,
                8 + MediaQuery.of(context).padding.bottom,
              ),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    offset: const Offset(0, -1),
                    blurRadius: 10,
                  ),
                ],
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () => Navigator.of(context).pop(),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Container(
                      height: 40,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: TextField(
                        controller: _textController,
                        autofocus: true,
                        decoration: const InputDecoration(
                          hintText: 'Search...',
                          border: InputBorder.none,
                          hintStyle: TextStyle(color: Colors.black38),
                          contentPadding: EdgeInsets.only(bottom: 10),
                          isDense: false,
                        ),
                        style: const TextStyle(
                          color: Colors.black87,
                          fontSize: 16,
                        ),
                        textInputAction: TextInputAction.search,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
