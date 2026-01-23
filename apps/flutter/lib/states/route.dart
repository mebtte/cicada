import 'package:flutter/material.dart';

/// 路由状态管理
/// 用于跟踪当前路由，以便 Player Controller 可以根据路由调整位置
class RouteState extends ChangeNotifier {
  String _currentRoute = '/';

  String get currentRoute => _currentRoute;

  void setRoute(String route) {
    if (_currentRoute != route) {
      _currentRoute = route;
      notifyListeners();
    }
  }
}

final routeState = RouteState();
