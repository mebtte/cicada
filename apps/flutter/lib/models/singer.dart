import 'package:cicada/utils/prefix_server_origin.dart';

class Singer {
  final String id;
  final String name;
  final String? avatar;
  final List<String> aliases;

  Singer({
    required this.id,
    required this.name,
    required this.avatar,
    required this.aliases,
  });

  factory Singer.fromJson(Map<String, dynamic> json) => Singer(
    id: json['id'],
    name: json['name'],
    avatar: prefixServerOrigin(json['avatar']),
    aliases:
        (json['aliases'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        [],
  );
}
