import 'dart:async';
import 'package:audio_service/audio_service.dart';

import 'package:cicada/player_controller/index.dart';
import 'package:flutter/material.dart';

import 'package:provider/provider.dart';
import './event_bus.dart';
import './pages/home/index.dart';
import './server_management/index.dart';
import './states/musicbill.dart' as musicbill_state;
import './user_management/index.dart';
import './states/server.dart';
import './pages/musicbill/index.dart' as musicbill_page;
import './pages/profile/index.dart';
import './widgets/play_error_dialog.dart';
import './theme.dart';

class AppContent extends StatefulWidget {
  const AppContent({super.key});

  @override
  State<AppContent> createState() => _AppContentState();
}

class _AppContentState extends State<AppContent> {
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();
  StreamSubscription<PlayErrorEvent>? _errorSubscription;

  @override
  void initState() {
    super.initState();
    musicbill_state.musicbillState.reloadMusicbillList(silence: false);
    _errorSubscription = eventBus.on<PlayErrorEvent>().listen((event) {
      _showPlayError(event);
    });
  }

  @override
  void dispose() {
    _errorSubscription?.cancel();
    super.dispose();
  }

  @override
  void reassemble() {
    super.reassemble();
    context.read<AudioHandler>().stop();
  }

  void _showPlayError(PlayErrorEvent event) {
    final navContext = _navigatorKey.currentContext;
    if (navContext != null) {
      showPlayErrorDialog(navContext, event);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: appTheme,
      home: Stack(
        children: [
          // ... (Navigator and PlayerController)
          Navigator(
            key: _navigatorKey,
            onGenerateRoute: (setting) {
              switch (setting.name) {
                case '/musicbill':
                  {
                    final args = setting.arguments as Map<String, dynamic>;
                    return MaterialPageRoute(
                      builder: (_) => musicbill_page.Musicbill(id: args['id']),
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
