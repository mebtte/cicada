import '../../server/base/login_with_2fa.dart';
import '../../server/api/get_profile.dart';
import '../../states/server.dart';
import 'package:flutter/material.dart';

class TwoFAWidget extends StatefulWidget {
  final String username;
  final String password;

  const TwoFAWidget({
    super.key,
    required this.username,
    required this.password,
  });

  @override
  State<TwoFAWidget> createState() => _TwoFAWidgetState();
}

class _TwoFAWidgetState extends State<TwoFAWidget> {
  late TextEditingController twoFATokenController;
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    twoFATokenController = TextEditingController();
  }

  @override
  void dispose() {
    twoFATokenController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          top: 16,
          left: 16,
          right: 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              "Enter 2FA Code",
              style: Theme.of(context).textTheme.titleLarge,
            ),
            SizedBox(height: 16),
            TextField(
              controller: twoFATokenController,
              decoration: InputDecoration(
                label: Text("2FA Code"),
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: isLoading
                  ? null
                  : () async {
                      final twoFAToken = twoFATokenController.text;
                      if (twoFAToken.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text("Please enter 2FA code")),
                        );
                        return;
                      }

                      setState(() => isLoading = true);
                      try {
                        final token = await loginWith2FA(
                          username: widget.username,
                          password: widget.password,
                          twoFAToken: twoFAToken,
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
                        setState(() => isLoading = false);
                      }
                    },
              child: isLoading
                  ? SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text("Submit"),
            ),
            SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
