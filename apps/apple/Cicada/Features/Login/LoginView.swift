import SwiftUI

struct LoginView: View {
    @ObservedObject var store: ServerSetupStore
    @StateObject private var loginStore = LoginStore()
    @FocusState private var focusedField: Field?

    private enum Field {
        case username
        case password
        case captcha
    }

    var body: some View {
        Form {
            if let server = store.selectedServer {
                Section("Server") {
                    HStack {
                        Label(server.hostname, systemImage: "network")
                        Spacer()
                        Text(server.version)
                            .foregroundStyle(.secondary)
                    }
                    Text(server.origin)
                        .font(.footnote)
                        .foregroundStyle(.secondary)

                    Button("Change Server") {
                        store.showServerSetup()
                    }
                }

                if !server.users.isEmpty {
                    Section("Saved Users") {
                        ForEach(sortedUsers(from: server)) { user in
                            Button {
                                store.selectUser(user)
                            } label: {
                                HStack(spacing: 12) {
                                    ArtworkView(
                                        urlString: user.avatar,
                                        systemImage: "person.crop.circle",
                                        size: 44
                                    )

                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(user.nickname)
                                        Text(user.username)
                                            .font(.footnote)
                                            .foregroundStyle(.secondary)
                                    }

                                    Spacer()

                                    if server.selectedUserID == user.id {
                                        Image(systemName: "checkmark")
                                            .foregroundStyle(.tint)
                                    }
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                Section("Sign In") {
                    TextField("Username", text: $loginStore.username)
                        #if os(iOS)
                        .textInputAutocapitalization(.never)
                        #endif
                        .autocorrectionDisabled()
                        .focused($focusedField, equals: .username)
                        .submitLabel(.next)
                        .onSubmit {
                            focusedField = .password
                        }

                    SecureField("Password", text: $loginStore.password)
                        .focused($focusedField, equals: .password)
                        .submitLabel(.next)
                        .onSubmit {
                            focusedField = .captcha
                        }

                    captchaBlock(server: server)

                    Button {
                        Task {
                            await loginStore.signIn(serverStore: store)
                        }
                    } label: {
                        if loginStore.isSigningIn {
                            Label("Signing In", systemImage: "ellipsis.circle")
                        } else {
                            Label("Sign In", systemImage: "person.crop.circle.badge.checkmark")
                        }
                    }
                    .disabled(!loginStore.canSubmit)
                }
            } else {
                ContentUnavailableView(
                    "No Server Selected",
                    systemImage: "network.slash",
                    description: Text("Choose a server before signing in.")
                )
            }
        }
        .navigationTitle("Sign In")
        .task(id: store.selectedServerOrigin) {
            await loginStore.loadCaptcha(server: store.selectedServer)
        }
        .alert(
            "Sign In Failed",
            isPresented: Binding(
                get: { loginStore.errorMessage != nil },
                set: { isPresented in
                    if !isPresented {
                        loginStore.dismissError()
                    }
                }
            )
        ) {
            Button("OK", role: .cancel) {
                loginStore.dismissError()
            }
        } message: {
            Text(loginStore.errorMessage ?? "")
        }
        .alert(
            "Session Ended",
            isPresented: Binding(
                get: { store.authenticationMessage != nil },
                set: { isPresented in
                    if !isPresented {
                        store.dismissAuthenticationMessage()
                    }
                }
            )
        ) {
            Button("OK", role: .cancel) {
                store.dismissAuthenticationMessage()
            }
        } message: {
            Text(store.authenticationMessage ?? "")
        }
        .sheet(isPresented: $loginStore.needsTwoFA) {
            TwoFALoginSheet(loginStore: loginStore, serverStore: store)
        }
        .onAppear {
            focusedField = store.selectedServer?.users.isEmpty == false ? nil : .username
        }
    }

    @ViewBuilder
    private func captchaBlock(server: ServerRecord) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Group {
                    if let captcha = loginStore.captcha {
                        CaptchaImageView(svg: captcha.svg)
                    } else if loginStore.isLoadingCaptcha {
                        ProgressView()
                    } else {
                        Image(systemName: "checkmark.shield")
                            .foregroundStyle(.secondary)
                    }
                }
                .frame(width: 160, height: 54)
                .background(Color.cicadaSecondaryBackground)
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

                Button {
                    Task {
                        await loginStore.loadCaptcha(server: server)
                    }
                } label: {
                    Label("Refresh", systemImage: "arrow.clockwise")
                }
                .disabled(loginStore.isLoadingCaptcha || loginStore.isSigningIn)
            }

            TextField("Captcha", text: $loginStore.captchaValue)
                #if os(iOS)
                .textInputAutocapitalization(.never)
                #endif
                .autocorrectionDisabled()
                .focused($focusedField, equals: .captcha)
                .submitLabel(.go)
                .onSubmit {
                    Task {
                        await loginStore.signIn(serverStore: store)
                    }
                }
        }
    }

    private func sortedUsers(from server: ServerRecord) -> [ServerUserRecord] {
        guard let selectedUserID = server.selectedUserID,
              let selectedUser = server.users.first(where: { $0.id == selectedUserID }) else {
            return server.users
        }
        return [selectedUser] + server.users.filter { $0.id != selectedUserID }
    }
}

private struct TwoFALoginSheet: View {
    @ObservedObject var loginStore: LoginStore
    @ObservedObject var serverStore: ServerSetupStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Two-Factor Authentication") {
                    TextField("Token", text: $loginStore.twoFAToken)
                        #if os(iOS)
                        .keyboardType(.numberPad)
                        .textInputAutocapitalization(.never)
                        #endif
                        .autocorrectionDisabled()
                }
            }
            .navigationTitle("2FA")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        loginStore.twoFAToken = ""
                        loginStore.needsTwoFA = false
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Sign In") {
                        Task {
                            await loginStore.signInWith2FA(serverStore: serverStore)
                            if serverStore.selectedUser != nil {
                                dismiss()
                            }
                        }
                    }
                    .disabled(loginStore.twoFAToken.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || loginStore.isSigningIn)
                }
            }
        }
    }
}

struct LoginViewPreviews: PreviewProvider {
    static var previews: some View {
        NavigationStack {
            LoginView(store: .preview)
        }
    }
}
