import 'package:cicada/utils/prefix_server_origin.dart';

import '../../constants/index.dart';
import '../../server/request.dart';

class Profile {
  final String id;
  final String username;
  final String? avatar;
  final String nickname;
  final int joinTimestamp;
  final bool twoFAEnabled;

  Profile({
    required this.id,
    required this.username,
    required this.avatar,
    required this.nickname,
    required this.joinTimestamp,
    required this.twoFAEnabled,
  });

  factory Profile.fromJSON(Map<String, dynamic> json) => Profile(
    id: json['id'],
    username: json['username'],
    avatar: prefixServerOrigin(json['avatar']),
    nickname: json['nickname'],
    joinTimestamp: json['joinTimestamp'],
    twoFAEnabled: json['twoFAEnabled'],
  );
}

Future<Profile> getProfile(String? token) async {
  Map<String, String> headers = {};
  if (token != null) {
    headers[TOKEN_HEADER_KEY] = token;
  }
  final responseData = await httpGet(path: "/api/profile", headers: headers);
  return Profile.fromJSON(responseData);
}
