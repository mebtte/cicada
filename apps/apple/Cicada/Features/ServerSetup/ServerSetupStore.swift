import Foundation

@MainActor
final class ServerSetupStore: ObservableObject {
    static let storageKey = "io.github.manyone.cicada.apple.serverSnapshot"

    @Published private(set) var savedServers: [ServerRecord]
    @Published var selectedServerOrigin: String?
    @Published var draftOrigin: String
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
        let initialSelectedOrigin = snapshot.selectedServerOrigin
            ?? snapshot.savedServers.first?.origin

        savedServers = snapshot.savedServers
        selectedServerOrigin = initialSelectedOrigin
        draftOrigin = initialSelectedOrigin ?? ""
    }

    var selectedServer: ServerRecord? {
        savedServers.first(where: { $0.origin == selectedServerOrigin })
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
        selectedServerOrigin = server.origin
        draftOrigin = server.origin
        persist()
    }

    func showServerSetup() {
        selectedServerOrigin = nil
        draftOrigin = savedServers.first?.origin ?? ""
        persist()
    }

    func selectUser(_ user: ServerUserRecord) {
        guard let selectedServerOrigin else { return }
        savedServers = savedServers.map { server in
            guard server.origin == selectedServerOrigin else { return server }
            var next = server
            next.selectedUserID = user.id
            return next
        }
        persist()
    }

    func clearSelectedUser() {
        guard let selectedServerOrigin else { return }
        savedServers = savedServers.map { server in
            guard server.origin == selectedServerOrigin else { return server }
            var next = server
            next.selectedUserID = nil
            return next
        }
        persist()
    }

    func removeSelectedUser(message: String? = nil) {
        guard
            let selectedServerOrigin,
            let selectedUserID = selectedServer?.selectedUserID
        else {
            return
        }
        savedServers = savedServers.map { server in
            guard server.origin == selectedServerOrigin else { return server }
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
        guard let selectedServerOrigin else { return }
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
            guard server.origin == selectedServerOrigin else { return server }
            var next = server
            next.users.removeAll(where: { $0.id == user.id })
            next.users.append(user)
            next.selectedUserID = user.id
            return next
        }
        persist()
    }

    func connectDraftOrigin() async {
        guard !isConnecting else { return }

        do {
            let normalizedOrigin = try normalizeOrigin(from: draftOrigin)
            draftOrigin = normalizedOrigin

            isConnecting = true
            defer { isConnecting = false }

            let metadata = try await client.fetchMetadata(normalizedOrigin)
            if savedServers.contains(where: { $0.origin == normalizedOrigin }) {
                updateServerMetadata(origin: normalizedOrigin, metadata: metadata)
                selectedServerOrigin = normalizedOrigin
            } else {
                let record = ServerRecord(
                    version: metadata.version,
                    hostname: metadata.hostname,
                    imageFileMaxSize: metadata.imageFileMaxSize,
                    audioFileMaxSize: metadata.audioFileMaxSize,
                    videoFileMaxSize: metadata.videoFileMaxSize,
                    origin: normalizedOrigin,
                    users: [],
                    selectedUserID: nil
                )

                savedServers.insert(record, at: 0)
                selectedServerOrigin = record.origin
            }
            selectedServerMetadataError = nil
            draftOrigin = normalizedOrigin
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
            let metadata = try await client.fetchMetadata(selectedServer.origin)
            updateServerMetadata(origin: selectedServer.origin, metadata: metadata)
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

        savedServers.removeAll(where: { $0.origin == pendingDeletion.origin })
        if selectedServerOrigin == pendingDeletion.origin {
            selectedServerOrigin = savedServers.first?.origin
        }
        if draftOrigin == pendingDeletion.origin {
            draftOrigin = selectedServerOrigin ?? ""
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
                    origin: "https://studio.cicada.local",
                    users: [],
                    selectedUserID: nil
                ),
                ServerRecord(
                    version: "3.5.0",
                    hostname: "archive.cicada.local",
                    imageFileMaxSize: nil,
                    audioFileMaxSize: nil,
                    videoFileMaxSize: nil,
                    origin: "https://archive.cicada.local",
                    users: [],
                    selectedUserID: nil
                ),
            ],
            selectedServerOrigin: "https://studio.cicada.local"
        )

        if let data = try? JSONEncoder().encode(snapshot) {
            defaults.set(data, forKey: storageKey)
        }

        return ServerSetupStore(client: .preview, storage: defaults)
    }

    private func normalizeOrigin(from rawValue: String) throws -> String {
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

        if !components.percentEncodedPath.isEmpty, components.percentEncodedPath != "/" {
            throw ServerSetupError.pathNotSupported
        }

        if components.query != nil || components.fragment != nil {
            throw ServerSetupError.invalidAddress
        }

        components.scheme = scheme
        components.host = host
        components.percentEncodedPath = ""

        guard let normalizedURL = components.url else {
            throw ServerSetupError.invalidAddress
        }

        return normalizedURL.absoluteString
    }

    private func persist() {
        let snapshot = ServerSnapshot(
            savedServers: savedServers,
            selectedServerOrigin: selectedServerOrigin
        )

        guard let data = try? JSONEncoder().encode(snapshot) else {
            return
        }
        storage.set(data, forKey: Self.storageKey)
    }

    private func updateServerMetadata(origin: String, metadata: ServerMetadata) {
        savedServers = savedServers.map { server in
            guard server.origin == origin else { return server }
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
            return ServerSnapshot(savedServers: [], selectedServerOrigin: nil)
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
    case pathNotSupported

    var errorDescription: String? {
        switch self {
        case .emptyAddress:
            return "Enter a server address first."
        case .invalidAddress:
            return "Use a valid server origin such as https://music.example.com."
        case .pathNotSupported:
            return "Enter only the server origin. Paths are not supported here."
        }
    }
}
