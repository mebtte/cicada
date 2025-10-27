import 'package:cicada/states/playlist.dart';
import 'package:cicada/states/playqueue.dart';

import './pages/home/index.dart';
import './server_management/index.dart';
import './states/musicbill.dart' as musicbill_state;
import './user_management/index.dart';
import './states/server.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import './pages/musicbill/index.dart' as musicbill_page;

class AppContent extends StatefulWidget {
  const AppContent({super.key});

  @override
  State<AppContent> createState() => _AppContentState();
}

class _AppContentState extends State<AppContent> {
  @override
  void initState() {
    super.initState();
    musicbill_state.musicbillState.reloadMusicbillList(silence: false);
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: musicbill_state.musicbillState),
        ChangeNotifierProvider.value(value: playlistState),
        ChangeNotifierProvider.value(value: playqueueState),
      ],
      child: MaterialApp(
        initialRoute: '/',
        routes: {
          '/': (context) => Home(),
          "/musicbill": (context) => musicbill_page.Musicbill(),
        },
      ),
    );
  }
}

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    final serverState = context.watch<ServerState>();
    return MaterialApp(
      home: serverState.currentServer == null
          ? ServerManagement()
          : serverState.currentUser == null
          ? UserManagement()
          : AppContent(),
    );
  }
}
