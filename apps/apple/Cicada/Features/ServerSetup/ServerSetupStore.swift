import Foundation

@MainActor
final class ServerSetupStore: ObservableObject {
    static let storageKey = "io.github.manyone.cicada.apple.serverSnapshot"

    @Published private(set) var savedServers: [ServerRecord]
    @Published var selectedServerBaseURL: String?
    @Published var draftBaseURL: String
    @Published var isConnecting = false
    @Published private(set) var isRefreshingSelectedServerMetadata = false
    @Published private(set) var selectedServerMetadataError: String?
    @Published var errorMessage: String?
    @Published var authenticationMessage: String?
    @Published var pendingDeletion: ServerRecord?

    private let client: ServerMetadataClient
    private let storage: UserDefaults

    init(
        client: ServerMetadataClient = .live,
        storage: UserDefaults = .standard
    ) {
        self.client = client
        self.storage = storage

        let snapshot = Self.loadSnapshot(from: storage)
        let initialSelectedBaseURL = snapshot.selectedServerBaseURL
            ?? snapshot.savedServers.first?.baseURL

        savedServers = snapshot.savedServers
        selectedServerBaseURL = initialSelectedBaseURL
        draftBaseURL = initialSelectedBaseURL ?? ""
    }

    var selectedServer: ServerRecord? {
        savedServers.first(where: { $0.baseURL == selectedServerBaseURL })
    }

    var selectedUser: ServerUserRecord? {
        selectedServer?.selectedUser
    }

    var selectedServerVersionWarning: String? {
        guard
            let selectedServer,
            let appMajorVersion = AppVersion.majorVersion(from: appVersion),
            let serverMajorVersion = AppVersion.majorVersion(from: selectedServer.version),
            appMajorVersion != serverMajorVersion
        else {
            return nil
        }
        return "Server \(selectedServer.version) may not match app \(appVersion)."
    }

    func select(_ server: ServerRecord) {
        selectedServerBaseURL = server.baseURL
        draftBaseURL = server.baseURL
        persist()
    }

    func showServerSetup() {
        selectedServerBaseURL = nil
        draftBaseURL = savedServers.first?.baseURL ?? ""
        persist()
    }

    func selectUser(_ user: ServerUserRecord) {
        guard let selectedServerBaseURL else { return }
        savedServers = savedServers.map { server in
            guard server.baseURL == selectedServerBaseURL else { return server }
            var next = server
            next.selectedUserID = user.id
            return next
        }
        persist()
    }

    func clearSelectedUser() {
        guard let selectedServerBaseURL else { return }
        savedServers = savedServers.map { server in
            guard server.baseURL == selectedServerBaseURL else { return server }
            var next = server
            next.selectedUserID = nil
            return next
        }
        persist()
    }

    func removeSelectedUser(message: String? = nil) {
        guard
            let selectedServerBaseURL,
            let selectedUserID = selectedServer?.selectedUserID
        else {
            return
        }
        savedServers = savedServers.map { server in
            guard server.baseURL == selectedServerBaseURL else { return server }
            var next = server
            next.users.removeAll(where: { $0.id == selectedUserID })
            next.selectedUserID = nil
            return next
        }
        authenticationMessage = message
        persist()
    }

    func dismissAuthenticationMessage() {
        authenticationMessage = nil
    }

    func upsertAuthenticatedUser(
        profile: UserProfile,
        token: String,
        sessionID: String
    ) {
        guard let selectedServerBaseURL else { return }
        let user = ServerUserRecord(
            id: profile.id,
            username: profile.username,
            avatar: profile.avatar,
            nickname: profile.nickname,
            joinTimestamp: profile.joinTimestamp,
            admin: profile.admin,
            musicbillOrders: profile.musicbillOrders,
            twoFAEnabled: profile.twoFAEnabled,
            token: token,
            sessionID: sessionID
        )

        savedServers = savedServers.map { server in
            guard server.baseURL == selectedServerBaseURL else { return server }
            var next = server
            next.users.removeAll(where: { $0.id == user.id })
            next.users.append(user)
            next.selectedUserID = user.id
            return next
        }
        persist()
    }

    func updateSelectedUser(profile: UserProfile) {
        guard let selectedServerBaseURL else { return }
        savedServers = savedServers.map { server in
            guard server.baseURL == selectedServerBaseURL else { return server }
            var next = server
            next.users = next.users.map { user in
                guard user.id == profile.id else { return user }
                var nextUser = user
                nextUser.username = profile.username
                nextUser.avatar = profile.avatar
                nextUser.nickname = profile.nickname
                nextUser.joinTimestamp = profile.joinTimestamp
                nextUser.admin = profile.admin
                nextUser.musicbillOrders = profile.musicbillOrders
                nextUser.twoFAEnabled = profile.twoFAEnabled
                return nextUser
            }
            if next.selectedUserID == nil,
               next.users.contains(where: { $0.id == profile.id }) {
                next.selectedUserID = profile.id
            }
            return next
        }
        persist()
    }

    func connectDraftBaseURL() async {
        guard !isConnecting else { return }

        do {
            let normalizedBaseURL = try normalizeBaseURL(from: draftBaseURL)
            draftBaseURL = normalizedBaseURL

            isConnecting = true
            defer { isConnecting = false }

            let metadata = try await client.fetchMetadata(normalizedBaseURL)
            if savedServers.contains(where: { $0.baseURL == normalizedBaseURL }) {
                updateServerMetadata(baseURL: normalizedBaseURL, metadata: metadata)
                selectedServerBaseURL = normalizedBaseURL
            } else {
                let record = ServerRecord(
                    version: metadata.version,
                    hostname: metadata.hostname,
                    imageFileMaxSize: metadata.imageFileMaxSize,
                    audioFileMaxSize: metadata.audioFileMaxSize,
                    videoFileMaxSize: metadata.videoFileMaxSize,
                    baseURL: normalizedBaseURL,
                    users: [],
                    selectedUserID: nil
                )

                savedServers.insert(record, at: 0)
                selectedServerBaseURL = record.baseURL
            }
            selectedServerMetadataError = nil
            draftBaseURL = normalizedBaseURL
            persist()
        } catch {
            errorMessage = presentableMessage(for: error)
        }
    }

    func refreshSelectedServerMetadata() async {
        guard
            let selectedServer,
            !isRefreshingSelectedServerMetadata
        else {
            return
        }

        isRefreshingSelectedServerMetadata = true
        defer {
            isRefreshingSelectedServerMetadata = false
        }

        do {
            let metadata = try await client.fetchMetadata(selectedServer.baseURL)
            updateServerMetadata(baseURL: selectedServer.baseURL, metadata: metadata)
            selectedServerMetadataError = nil
            persist()
        } catch {
            selectedServerMetadataError = presentableMessage(for: error)
        }
    }

    func prepareToDelete(_ server: ServerRecord) {
        pendingDeletion = server
    }

    func deletePendingServer() {
        guard let pendingDeletion else { return }

        savedServers.removeAll(where: { $0.baseURL == pendingDeletion.baseURL })
        if selectedServerBaseURL == pendingDeletion.baseURL {
            selectedServerBaseURL = savedServers.first?.baseURL
        }
        if draftBaseURL == pendingDeletion.baseURL {
            draftBaseURL = selectedServerBaseURL ?? ""
        }
        self.pendingDeletion = nil
        persist()
    }

    func dismissError() {
        errorMessage = nil
    }

    static var preview: ServerSetupStore {
        let suiteName = "preview.server.setup"
        guard let defaults = UserDefaults(suiteName: suiteName) else {
            return ServerSetupStore(client: .preview)
        }

        defaults.removePersistentDomain(forName: suiteName)

        let snapshot = ServerSnapshot(
            savedServers: [
                ServerRecord(
                    version: "3.6.0",
                    hostname: "studio.cicada.local",
                    imageFileMaxSize: nil,
                    audioFileMaxSize: nil,
                    videoFileMaxSize: nil,
                    baseURL: "https://studio.cicada.local",
                    users: [],
                    selectedUserID: nil
                ),
                ServerRecord(
                    version: "3.5.0",
                    hostname: "archive.cicada.local",
                    imageFileMaxSize: nil,
                    audioFileMaxSize: nil,
                    videoFileMaxSize: nil,
                    baseURL: "https://archive.cicada.local",
                    users: [],
                    selectedUserID: nil
                ),
            ],
            selectedServerBaseURL: "https://studio.cicada.local"
        )

        if let data = try? JSONEncoder().encode(snapshot) {
            defaults.set(data, forKey: storageKey)
        }

        return ServerSetupStore(client: .preview, storage: defaults)
    }

    private func normalizeBaseURL(from rawValue: String) throws -> String {
        let trimmed = rawValue.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            throw ServerSetupError.emptyAddress
        }

        let candidate = trimmed.contains("://") ? trimmed : "https://\(trimmed)"
        guard var components = URLComponents(string: candidate) else {
            throw ServerSetupError.invalidAddress
        }

        guard
            let scheme = components.scheme?.lowercased(),
            ["http", "https"].contains(scheme),
            let host = components.host?.lowercased(),
            !host.isEmpty
        else {
            throw ServerSetupError.invalidAddress
        }

        if components.user != nil || components.password != nil {
            throw ServerSetupError.invalidAddress
        }

        if components.query != nil || components.fragment != nil {
            throw ServerSetupError.invalidAddress
        }

        var basePath = components.percentEncodedPath
        if basePath.hasSuffix("/") {
            basePath.removeLast()
        }
        if !basePath.isEmpty {
            let allowed = CharacterSet(charactersIn: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~")
            let segments = basePath.dropFirst().split(separator: "/", omittingEmptySubsequences: false)
            guard basePath.hasPrefix("/"),
                  segments.allSatisfy({ segment in
                      !segment.isEmpty && segment != "." && segment != ".."
                          && segment.unicodeScalars.allSatisfy(allowed.contains)
                  }) else {
                throw ServerSetupError.invalidAddress
            }
        }

        components.scheme = scheme
        components.host = host
        components.percentEncodedPath = basePath

        guard let normalizedURL = components.url else {
            throw ServerSetupError.invalidAddress
        }

        return normalizedURL.absoluteString
    }

    private func persist() {
        let snapshot = ServerSnapshot(
            savedServers: savedServers,
            selectedServerBaseURL: selectedServerBaseURL
        )

        guard let data = try? JSONEncoder().encode(snapshot) else {
            return
        }
        storage.set(data, forKey: Self.storageKey)
    }

    private func updateServerMetadata(baseURL: String, metadata: ServerMetadata) {
        savedServers = savedServers.map { server in
            guard server.baseURL == baseURL else { return server }
            var next = server
            next.version = metadata.version
            next.hostname = metadata.hostname
            next.imageFileMaxSize = metadata.imageFileMaxSize
            next.audioFileMaxSize = metadata.audioFileMaxSize
            next.videoFileMaxSize = metadata.videoFileMaxSize
            return next
        }
    }

    private static func loadSnapshot(from storage: UserDefaults) -> ServerSnapshot {
        guard
            let data = storage.data(forKey: storageKey),
            let snapshot = try? JSONDecoder().decode(ServerSnapshot.self, from: data)
        else {
            return ServerSnapshot(savedServers: [], selectedServerBaseURL: nil)
        }
        return snapshot
    }

    private func presentableMessage(for error: Error) -> String {
        if let localizedError = error as? LocalizedError,
           let description = localizedError.errorDescription,
           !description.isEmpty {
            return description
        }

        return error.localizedDescription
    }

    private var appVersion: String {
        AppVersion.current
    }
}

enum ServerSetupError: LocalizedError {
    case emptyAddress
    case invalidAddress

    var errorDescription: String? {
        switch self {
        case .emptyAddress:
            return "Enter a server address first."
        case .invalidAddress:
            return "Use a valid server URL such as https://music.example.com/cicada."
        }
    }
}
