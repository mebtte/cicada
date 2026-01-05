import '../../utils/prefix_server_origin.dart';
import '../request.dart';

class Musicbill {
  final String id;
  final String name;
  final String? cover;

  Musicbill({required this.id, required this.name, required this.cover});

  factory Musicbill.fromJson(Map<String, dynamic> json) => Musicbill(
    id: json['id'],
    name: json['name'],
    cover: prefixServerOrigin(json['cover']),
  );
}

Future<List<Musicbill>> getMusicbillList() async {
  final responseData = await httpGet(
    path: "/api/musicbill_list",
    withToken: true,
  );
  return (responseData as List<dynamic>)
      .map((json) => Musicbill.fromJson(json))
      .toList();
}
