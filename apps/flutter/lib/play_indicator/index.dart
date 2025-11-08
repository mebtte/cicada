import 'package:cicada/states/playqueue.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class PlayIndicator extends StatefulWidget {
  const PlayIndicator({super.key});

  @override
  State<PlayIndicator> createState() => _PlayIndicatorState();
}

class _PlayIndicatorState extends State<PlayIndicator> {
  @override
  Widget build(BuildContext context) {
    final currentMusic = context.watch<PlayqueueState>().currentMusic;
    return currentMusic == null ? Container() : Text("data");
  }
}
