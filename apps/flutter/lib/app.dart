import 'package:cicada/audio_handler.dart';
import 'package:cicada/player_controller/index.dart';
import 'package:cicada/states/audio.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:provider/provider.dart';
import './states/playlist.dart';
import './states/playqueue.dart';
import './states/route.dart';
import './pages/home/index.dart';
import './server_management/index.dart';
import './states/musicbill.dart' as musicbill_state;
import './user_management/index.dart';
import './states/server.dart';
import './pages/musicbill/index.dart' as musicbill_page;
import './pages/profile/index.dart';
import './theme.dart';

class AppContent extends StatefulWidget {
  const AppContent({super.key});

  @override
  State<AppContent> createState() => _AppContentState();
}

class _AppContentState extends State<AppContent> {
  // ... initState and reassemble ...
  @override
  void initState() {
    super.initState();
    musicbill_state.musicbillState.reloadMusicbillList(silence: false);
  }

  @override
  void reassemble() {
    super.reassemble();
    GetIt.instance.get<MyAudioHandler>().stop();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: musicbill_state.musicbillState),
        ChangeNotifierProvider.value(value: playlistState),
        ChangeNotifierProvider.value(value: playqueueState),
        ChangeNotifierProvider.value(value: audioState),
        ChangeNotifierProvider.value(value: routeState),
      ],
      child: MaterialApp(
        theme: appTheme,
        home: Stack(
          children: [
            // ... (Navigator and PlayerController)
            Navigator(
              key: GlobalKey<NavigatorState>(),
              onGenerateRoute: (setting) {
                switch (setting.name) {
                  case '/musicbill':
                    {
                      final args = setting.arguments as Map<String, dynamic>;
                      return MaterialPageRoute(
                        builder: (_) =>
                            musicbill_page.Musicbill(id: args['id']),
                      );
                    }
                  case '/profile':
                    {
                      return MaterialPageRoute(
                        builder: (_) => const ProfilePage(),
                      );
                    }
                  default:
                    {
                      return MaterialPageRoute(builder: (_) => Home());
                    }
                }
              },
            ),
            PlayerControllerContainer(),
          ],
        ),
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
      theme: appTheme,
      home: serverState.currentServer == null
          ? ServerManagement()
          : serverState.currentUser == null
          ? UserManagement()
          : AppContent(),
    );
  }
}
