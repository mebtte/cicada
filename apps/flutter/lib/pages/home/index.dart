import '../../states/musicbill.dart';
import '../../states/server.dart';
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
