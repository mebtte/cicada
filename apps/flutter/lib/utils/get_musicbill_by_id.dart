import '../states/musicbill.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

Musicbill useMusicbillById(BuildContext context, String id) {
  final musicbillList = context.watch<MusicbillState>().musicbillList;
  return musicbillList.firstWhere((m) => m.id == id);
}
