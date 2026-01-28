import 'dart:async';
import 'package:flutter/material.dart';
import '../../server/api/get_exploration.dart';
import '../search/index.dart';
import '../../states/route.dart';
import '../../widgets/error_view.dart';
import './exploration_grid.dart';
import './search_toolbar.dart';

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
            child: SearchToolbar(
              controller: _searchController,
              focusNode: _searchFocusNode,
              onSubmitted: _onSearch,
              height: _bottomToolbarHeight,
            ),
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
      return ErrorView(errorMessage: _errorMessage, onRetry: _loadData);
    }

    if (_explorationData == null) {
      return const Center(child: Text('暂无数据'));
    }

    return ExplorationGrid(
      data: _explorationData!,
      bottomToolbarHeight: _bottomToolbarHeight,
    );
  }
}
