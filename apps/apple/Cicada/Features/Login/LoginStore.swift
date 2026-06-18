import Foundation

@MainActor
final class LoginStore: ObservableObject {
    private enum Limits {
        static let usernameMaxLength = 16
        static let passwordMinLength = 6
        static let passwordMaxLength = 32
    }

    @Published var username = ""
    @Published var password = ""
    @Published var captchaValue = ""
    @Published private(set) var captcha: CaptchaResponse?
    @Published private(set) var isLoadingCaptcha = false
    @Published private(set) var isSigningIn = false
    @Published var errorMessage: String?
    @Published var needsTwoFA = false
    @Published var twoFAToken = ""

    var canSubmit: Bool {
        !username.isEmpty &&
            !password.isEmpty &&
            !captchaValue.isEmpty &&
            !isSigningIn &&
            !isLoadingCaptcha
    }

    func loadCaptcha(server: ServerRecord?) async {
        guard let server, !isLoadingCaptcha else { return }
        isLoadingCaptcha = true
        defer { isLoadingCaptcha = false }

        do {
            captcha = try await CicadaAPIClient(server: server).getCaptcha()
            captchaValue = ""
        } catch {
            errorMessage = presentableMessage(for: error)
        }
    }

    func signIn(serverStore: ServerSetupStore) async {
        guard
            let server = serverStore.selectedServer,
            validateCredential()
        else {
            return
        }

        guard let captcha else {
            await loadCaptcha(server: server)
            return
        }

        isSigningIn = true
        defer { isSigningIn = false }

        do {
            let client = CicadaAPIClient(server: server)
            let loginResponse = try await client.login(
                username: username,
                password: password,
                captchaID: captcha.id,
                captchaValue: captchaValue,
                deviceName: deviceName
            )
            try await addProfile(
                loginResponse,
                server: server,
                serverStore: serverStore
            )
        } catch CicadaAPIError.business(let code, _) where code == "need_2fa" {
            needsTwoFA = true
        } catch {
            errorMessage = presentableMessage(for: error)
            await loadCaptcha(server: server)
        }
    }

    func signInWith2FA(serverStore: ServerSetupStore) async {
        guard
            let server = serverStore.selectedServer,
            validateCredential(),
            !twoFAToken.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        else {
            return
        }

        isSigningIn = true
        defer { isSigningIn = false }

        do {
            let client = CicadaAPIClient(server: server)
            let loginResponse = try await client.loginWith2FA(
                username: username,
                password: password,
                twoFAToken: twoFAToken.trimmingCharacters(in: .whitespacesAndNewlines),
                deviceName: deviceName
            )
            try await addProfile(
                loginResponse,
                server: server,
                serverStore: serverStore
            )
            twoFAToken = ""
            needsTwoFA = false
        } catch {
            errorMessage = presentableMessage(for: error)
        }
    }

    func dismissError() {
        errorMessage = nil
    }

    private func addProfile(
        _ loginResponse: LoginResponse,
        server: ServerRecord,
        serverStore: ServerSetupStore
    ) async throws {
        let client = CicadaAPIClient(server: server)
        let profile = try await client.getProfile(token: loginResponse.token)
        serverStore.upsertAuthenticatedUser(
            profile: profile,
            token: loginResponse.token,
            sessionID: loginResponse.sessionID
        )
        password = ""
        captchaValue = ""
    }

    private func validateCredential() -> Bool {
        username = String(username.trimmingCharacters(in: .whitespacesAndNewlines).prefix(Limits.usernameMaxLength))

        guard password.count >= Limits.passwordMinLength && password.count <= Limits.passwordMaxLength else {
            errorMessage = "Password must be \(Limits.passwordMinLength)-\(Limits.passwordMaxLength) characters."
            return false
        }
        return true
    }

    private var deviceName: String {
        "Cicada \(PlatformInfo.currentDisplayName)"
    }

    private func presentableMessage(for error: Error) -> String {
        if let localizedError = error as? LocalizedError,
           let description = localizedError.errorDescription,
           !description.isEmpty {
            return description
        }
        return error.localizedDescription
    }
}
