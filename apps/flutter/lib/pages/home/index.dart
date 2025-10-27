import '../../states/musicbill.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class Home extends StatelessWidget {
  const Home({super.key});

  @override
  Widget build(BuildContext context) {
    final musicbillList = context.watch<MusicbillState>().musicbillList;
    return Scaffold(
      appBar: AppBar(title: Text("Exploration")),
      body: Column(
        children: [
          if (musicbillList.isNotEmpty)
            Expanded(
              child: ListView.builder(
                itemCount: musicbillList.length,
                itemBuilder: (context, index) {
                  final musicbill = musicbillList[index];
                  return ListTile(
                    leading: const Icon(Icons.list),
                    title: Text(musicbill.name),
                    onTap: () => Navigator.pushNamed(
                      context,
                      "/musicbill",
                      arguments: {"id": musicbill.id},
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
