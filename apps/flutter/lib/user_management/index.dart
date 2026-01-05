import '../../server/api/get_profile.dart';
import '../../server/base/get_captcha.dart';
import '../../server/base/login.dart';
import '../../states/server.dart';
import '../../widgets/captcha.dart';
import 'package:flutter/material.dart';

class UserManagement extends StatefulWidget {
  const UserManagement({super.key});

  @override
  State<UserManagement> createState() => _UserManagementState();
}

class _UserManagementState extends State<UserManagement> {
  late TextEditingController usernameController;
  late TextEditingController passwordController;

  @override
  void initState() {
    super.initState();
    usernameController = TextEditingController();
    passwordController = TextEditingController();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ElevatedButton(
            onPressed: () {
              serverState.reselectServer();
            },
            child: Text("Change Server"),
          ),
          TextField(
            controller: usernameController,
            decoration: InputDecoration(
              label: Text("Username"),
              border: OutlineInputBorder(),
            ),
          ),
          TextField(
            obscureText: true,
            controller: passwordController,
            decoration: InputDecoration(
              label: Text("Password"),
              border: OutlineInputBorder(),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              final username = usernameController.text;
              final password = passwordController.text;
              if (username.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text("Please enter username")),
                );
                return;
              }
              if (password.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text("Please enter password")),
                );
                return;
              }
              showModalBottomSheet(
                context: context,
                builder: (context) => SizedBox(
                  width: double.infinity,
                  child: Center(
                    child: CaptchaWidget(
                      onContinue:
                          ({
                            required Captcha captcha,
                            required String input,
                          }) async {
                            try {
                              final token = await login(
                                username: username,
                                password: password,
                                captchaId: captcha.id,
                                captchaValue: input,
                              );
                              final profile = await getProfile(token);
                              serverState.addUser(
                                User(
                                  token: token,
                                  avatar: profile.avatar,
                                  id: profile.id,
                                  twoFAEnabled: profile.twoFAEnabled,
                                  username: profile.username,
                                  nickname: profile.nickname,
                                ),
                              );
                              Navigator.pop(context);
                            } catch (e) {
                              /**
                               * @todo error handle
                               * @author mebtte<i@mebtte.com>
                               */
                              print(e);
                            }
                          },
                    ),
                  ),
                ),
              );
            },
            child: Text("Login"),
          ),
        ],
      ),
    );
  }
}
