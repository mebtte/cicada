import '../../states/musicbill.dart';
import '../../states/server.dart';
import './user_info_card.dart';
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

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            UserInfoCard(user: currentUser, server: currentServer),
            MusicbillList(
              musicbillList: musicbillState.musicbillList,
              isLoading: musicbillState.loading,
            ),
          ],
        ),
      ),
    );
  }
}
