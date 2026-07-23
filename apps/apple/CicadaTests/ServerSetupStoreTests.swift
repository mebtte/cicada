import XCTest
@testable import Cicada

@MainActor
final class ServerSetupStoreTests: XCTestCase {
    func testCommonQueryOnlyContainsCanonicalClientLanguage() throws {
        let storage = try makeStorage()
        defer { storage.removePersistentDomain() }
        let settings = AppSettingsStore(storage: storage.defaults)

        settings.language = .zhHans
        var items = CicadaAPIQuery.commonItems(storage.defaults)
        XCTAssertEqual(items.count, 1)
        XCTAssertEqual(items.first?.name, "__client_language")
        XCTAssertEqual(items.first?.value, "zh-Hans")

        settings.language = .english
        items = CicadaAPIQuery.commonItems(storage.defaults)
        XCTAssertEqual(items.first?.value, "en")
    }

    func testConnectDraftOriginNormalizesAndPersistsServer() async throws {
        let storage = try makeStorage()
        defer { storage.removePersistentDomain() }

        let store = ServerSetupStore(
            client: .stub(metadata: .test(version: "3.6.0", hostname: "music.local")),
            storage: storage.defaults
        )
        store.draftOrigin = " Music.Local "

        await store.connectDraftOrigin()

        XCTAssertNil(store.errorMessage)
        XCTAssertEqual(store.draftOrigin, "https://music.local")
        XCTAssertEqual(store.selectedServerOrigin, "https://music.local")
        XCTAssertEqual(store.savedServers.map(\.origin), ["https://music.local"])
        XCTAssertEqual(store.selectedServer?.version, "3.6.0")

        let reloaded = ServerSetupStore(client: .stub(), storage: storage.defaults)
        XCTAssertEqual(reloaded.selectedServerOrigin, "https://music.local")
        XCTAssertEqual(reloaded.savedServers.first?.hostname, "music.local")
    }

    func testConnectDraftOriginRejectsPathsBeforeFetchingMetadata() async throws {
        let storage = try makeStorage()
        defer { storage.removePersistentDomain() }

        let store = ServerSetupStore(
            client: ServerMetadataClient { _ in
                throw ServerMetadataClientError.missingPayload
            },
            storage: storage.defaults
        )
        store.draftOrigin = "https://music.local/app"

        await store.connectDraftOrigin()

        XCTAssertEqual(
            store.errorMessage,
            ServerSetupError.pathNotSupported.errorDescription
        )
        XCTAssertTrue(store.savedServers.isEmpty)
    }

    func testSelectUserAndRemoveSelectedUserPersistChanges() throws {
        let storage = try makeStorage()
        defer { storage.removePersistentDomain() }

        persist(
            ServerSnapshot(
                savedServers: [
                    .test(
                        origin: "https://music.local",
                        users: [
                            .test(id: "u1", nickname: "One"),
                            .test(id: "u2", nickname: "Two"),
                        ],
                        selectedUserID: "u1"
                    ),
                ],
                selectedServerOrigin: "https://music.local"
            ),
            in: storage.defaults
        )
        let store = ServerSetupStore(client: .stub(), storage: storage.defaults)

        store.selectUser(.test(id: "u2", nickname: "Two"))
        XCTAssertEqual(store.selectedUser?.id, "u2")

        store.removeSelectedUser(message: "Session expired.")
        XCTAssertEqual(store.authenticationMessage, "Session expired.")
        XCTAssertNil(store.selectedUser)
        XCTAssertEqual(store.selectedServer?.users.map(\.id), ["u1"])

        let reloaded = ServerSetupStore(client: .stub(), storage: storage.defaults)
        XCTAssertNil(reloaded.selectedUser)
        XCTAssertEqual(reloaded.selectedServer?.users.map(\.id), ["u1"])
    }

    func testRefreshSelectedServerMetadataUpdatesExistingRecord() async throws {
        let storage = try makeStorage()
        defer { storage.removePersistentDomain() }

        persist(
            ServerSnapshot(
                savedServers: [
                    .test(
                        version: "3.5.0",
                        hostname: "old.local",
                        origin: "https://music.local"
                    ),
                ],
                selectedServerOrigin: "https://music.local"
            ),
            in: storage.defaults
        )
        let store = ServerSetupStore(
            client: .stub(
                metadata: .test(
                    version: "3.6.0",
                    hostname: "new.local",
                    imageFileMaxSize: 100,
                    audioFileMaxSize: 200,
                    videoFileMaxSize: 300
                )
            ),
            storage: storage.defaults
        )

        await store.refreshSelectedServerMetadata()

        XCTAssertNil(store.selectedServerMetadataError)
        XCTAssertEqual(store.selectedServer?.version, "3.6.0")
        XCTAssertEqual(store.selectedServer?.hostname, "new.local")
        XCTAssertEqual(store.selectedServer?.imageFileMaxSize, 100)
        XCTAssertEqual(store.selectedServer?.audioFileMaxSize, 200)
        XCTAssertEqual(store.selectedServer?.videoFileMaxSize, 300)
    }

    private func makeStorage() throws -> TestStorage {
        let suiteName = "io.github.manyone.cicada.apple.tests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defaults.removePersistentDomain(forName: suiteName)
        return TestStorage(suiteName: suiteName, defaults: defaults)
    }

    private func persist(_ snapshot: ServerSnapshot, in defaults: UserDefaults) {
        let data = try! JSONEncoder().encode(snapshot)
        defaults.set(data, forKey: ServerSetupStore.storageKey)
    }
}

private struct TestStorage {
    let suiteName: String
    let defaults: UserDefaults

    func removePersistentDomain() {
        defaults.removePersistentDomain(forName: suiteName)
    }
}

private extension ServerMetadataClient {
    static func stub(metadata: ServerMetadata = .test()) -> ServerMetadataClient {
        ServerMetadataClient { _ in metadata }
    }
}

private extension ServerMetadata {
    static func test(
        version: String = "3.6.0",
        hostname: String = "music.local",
        imageFileMaxSize: Int? = nil,
        audioFileMaxSize: Int? = nil,
        videoFileMaxSize: Int? = nil
    ) -> ServerMetadata {
        ServerMetadata(
            version: version,
            hostname: hostname,
            imageFileMaxSize: imageFileMaxSize,
            audioFileMaxSize: audioFileMaxSize,
            videoFileMaxSize: videoFileMaxSize
        )
    }
}

private extension ServerRecord {
    static func test(
        version: String = "3.6.0",
        hostname: String = "music.local",
        origin: String = "https://music.local",
        users: [ServerUserRecord] = [],
        selectedUserID: String? = nil
    ) -> ServerRecord {
        ServerRecord(
            version: version,
            hostname: hostname,
            imageFileMaxSize: nil,
            audioFileMaxSize: nil,
            videoFileMaxSize: nil,
            origin: origin,
            users: users,
            selectedUserID: selectedUserID
        )
    }
}

private extension ServerUserRecord {
    static func test(id: String, nickname: String = "User") -> ServerUserRecord {
        ServerUserRecord(
            id: id,
            username: id,
            avatar: "",
            nickname: nickname,
            joinTimestamp: 1_700_000_000,
            admin: false,
            musicbillOrders: [],
            twoFAEnabled: false,
            token: "token-\(id)",
            sessionID: "session-\(id)"
        )
    }
}
