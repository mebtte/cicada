import 'dart:collection';
import '../extensions/list.dart';
import '../server/base/get_metadata.dart';
import '../states/server.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

typedef ServerEntry = DropdownMenuEntry<Server>;

class ServerManagement extends StatefulWidget {
  const ServerManagement({super.key});

  @override
  State<ServerManagement> createState() => _ServerManagementState();
}

class _ServerManagementState extends State<ServerManagement> {
  late TextEditingController inputController;

  bool loading = false;

  @override
  void initState() {
    super.initState();
    inputController = TextEditingController();
  }

  @override
  void dispose() {
    inputController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final serverState = context.watch<ServerState>();
    return Scaffold(
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          if (serverState.serverList.isNotEmpty)
            DropdownMenu(
              onSelected: (server) =>
                  server == null ? null : serverState.useServer(server.origin),
              label: Text("Existed Servers"),
              dropdownMenuEntries: UnmodifiableListView<ServerEntry>(
                serverState.serverList.map<ServerEntry>(
                  (server) => ServerEntry(
                    label: '${server.hostname}(${server.origin})',
                    value: server,
                  ),
                ),
              ),
            ),
          ElevatedButton(
            onPressed: () => serverState.clearServers(),
            child: Text("Clear servers"),
          ),
          TextField(
            readOnly: loading,
            controller: inputController,
            decoration: InputDecoration(
              label: Text("Server Origin"),
              hint: Text(
                "https://cicada.example.com",
                style: TextStyle(color: Colors.grey),
              ),
              border: OutlineInputBorder(),
            ),
          ),
          ElevatedButton(
            onPressed: loading
                ? null
                : () async {
                    final origin = inputController.text;
                    if (origin.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text("Please enter server origin")),
                      );
                      return;
                    }

                    if (serverState.serverList.firstWhereOrNull(
                          (server) => server.origin == origin,
                        ) !=
                        null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            "This server origin has already existed",
                          ),
                        ),
                      );
                      return;
                    }

                    setState(() {
                      loading = true;
                    });
                    try {
                      final metadata = await getMetadata(origin);
                      serverState.addServer(
                        Server(
                          origin: origin,
                          hostname: metadata.hostname,
                          version: metadata.version,
                          users: <User>[],
                        ),
                      );
                    } catch (exception) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            "Failed to connect to \"$origin\" with exception \"${exception.toString()}\"",
                          ),
                        ),
                      );
                    }
                    setState(() {
                      loading = false;
                    });
                  },
            style: OutlinedButton.styleFrom(padding: EdgeInsets.all(20)),
            child: loading
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(),
                  )
                : Text("Connect"),
          ),
        ],
      ),
    );
  }
}
