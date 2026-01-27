import '../../states/musicbill.dart';
import '../../states/server.dart';
import '../search_intermediate/index.dart';
import './user_info_card.dart';
import './musicbill_list_header.dart';
import './musicbill_list.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class Home extends StatelessWidget {
  const Home({super.key});

  @override
  Widget build(BuildContext context) {
    final musicbillState = context.watch<MusicbillState>();
    final currentUser = context.watch<ServerState>().currentUser;
    final currentServer = context.watch<ServerState>().currentServer;

    final headerHeight = MediaQuery.of(context).size.width;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: false,
            stretch: true,
            expandedHeight: headerHeight,
            toolbarHeight: 0,
            collapsedHeight: 0,
            backgroundColor: Colors.transparent,
            automaticallyImplyLeading: false,
            flexibleSpace: FlexibleSpaceBar(
              background: UserInfoCard(
                user: currentUser,
                server: currentServer,
              ),
              stretchModes: const [StretchMode.zoomBackground],
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: GestureDetector(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => const SearchIntermediatePage(),
                    ),
                  );
                },
                child: Container(
                  height: 48,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.search, size: 20, color: Colors.black38),
                      const SizedBox(width: 12),
                      const Text(
                        'Search',
                        style: TextStyle(color: Colors.black38, fontSize: 14),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 16)),
          SliverToBoxAdapter(
            child: MusicbillListHeader(
              count: musicbillState.musicbillList.length,
            ),
          ),
          MusicbillList(
            musicbillList: musicbillState.musicbillList,
            isLoading: musicbillState.loading,
          ),
        ],
      ),
    );
  }
}
