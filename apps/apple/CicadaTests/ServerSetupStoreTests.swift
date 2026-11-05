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

        settings.language = .zhHant
        items = CicadaAPIQuery.commonItems(storage.defaults)
        XCTAssertEqual(items.first?.value, "zh-Hant")

        settings.language = .english
        items = CicadaAPIQuery.commonItems(storage.defaults)
        XCTAssertEqual(items.first?.value, "en")
    }

    func testSelectedLanguageIsOrderedBeforeRemainingOptions() {
        XCTAssertEqual(
            AppLanguageOption.orderedCases(selected: .zhHant),
            [.zhHant, .english, .system, .zhHans]
        )
        XCTAssertEqual(
            AppLanguageOption.orderedCases(selected: .zhHans),
            [.zhHans, .english, .system, .zhHant]
        )
    }

    func testConnectDraftBaseURLNormalizesAndPersistsServer() async throws {
        let storage = try makeStorage()
        defer { storage.removePersistentDomain() }

        let store = ServerSetupStore(
            client: .stub(metadata: .test(version: "3.6.0", hostname: "music.local")),
            storage: storage.defaults
        )
        store.draftBaseURL = " Music.Local "

        await store.connectDraftBaseURL()

        XCTAssertNil(store.errorMessage)
        XCTAssertEqual(store.draftBaseURL, "https://music.local")
        XCTAssertEqual(store.selectedServerBaseURL, "https://music.local")
        XCTAssertEqual(store.savedServers.map(\.baseURL), ["https://music.local"])
        XCTAssertEqual(store.selectedServer?.version, "3.6.0")

        let reloaded = ServerSetupStore(client: .stub(), storage: storage.defaults)
        XCTAssertEqual(reloaded.selectedServerBaseURL, "https://music.local")
        XCTAssertEqual(reloaded.savedServers.first?.hostname, "music.local")
    }

    func testConnectDraftBaseURLPreservesSubpathAndPersistsServer() async throws {
        let storage = try makeStorage()
        defer { storage.removePersistentDomain() }

        let store = ServerSetupStore(
            client: ServerMetadataClient { baseURL in
                XCTAssertEqual(baseURL, "https://music.local/tools/Cicada_v2-~.1")
                return .test()
            },
            storage: storage.defaults
        )
        store.draftBaseURL = " Music.Local/tools/Cicada_v2-~.1/ "

        await store.connectDraftBaseURL()

        XCTAssertNil(store.errorMessage)
        XCTAssertEqual(store.selectedServerBaseURL, "https://music.local/tools/Cicada_v2-~.1")
        let reloaded = ServerSetupStore(client: .stub(), storage: storage.defaults)
        XCTAssertEqual(reloaded.savedServers.first?.baseURL, store.selectedServerBaseURL)
    }

    func testConnectDraftBaseURLRejectsInvalidAddressesBeforeFetchingMetadata() async throws {
        let storage = try makeStorage()
        defer { storage.removePersistentDomain() }
        let store = ServerSetupStore(
            client: ServerMetadataClient { _ in
                XCTFail("Invalid addresses must be rejected before fetching metadata")
                throw ServerMetadataClientError.missingPayload
            },
            storage: storage.defaults
        )
        let invalidAddresses = [
            "https://music.local/app//nested", "https://music.local/app//",
            "https://music.local/.", "https://music.local/app/../nested",
            "https://music.local/%2e%2e", "https://music.local/app%2Fnested",
            "https://music.local/app space", "https://music.local/音乐",
            "https://music.local/app?query=1", "https://music.local/app#player",
            "https://user:password@music.local/app", "ftp://music.local/app",
        ]

        for address in invalidAddresses {
            store.draftBaseURL = address
            await store.connectDraftBaseURL()
            XCTAssertEqual(store.errorMessage, ServerSetupError.invalidAddress.errorDescription, address)
            XCTAssertTrue(store.savedServers.isEmpty, address)
        }
    }

    func testSameDomainSubpathsAreSeparateServersAndTrailingSlashDoesNotDuplicate() async throws {
        let storage = try makeStorage()
        defer { storage.removePersistentDomain() }
        let store = ServerSetupStore(client: .stub(), storage: storage.defaults)

        for address in ["https://music.local/", "https://music.local/a", "https://music.local/b/"] {
            store.draftBaseURL = address
            await store.connectDraftBaseURL()
        }
        XCTAssertEqual(Set(store.savedServers.map(\.baseURL)), Set([
            "https://music.local", "https://music.local/a", "https://music.local/b",
        ]))
        store.draftBaseURL = "https://music.local/a/"
        await store.connectDraftBaseURL()
        XCTAssertEqual(store.savedServers.count, 3)
        XCTAssertEqual(store.selectedServerBaseURL, "https://music.local/a")
    }

    func testSelectUserAndRemoveSelectedUserPersistChanges() throws {
        let storage = try makeStorage()
        defer { storage.removePersistentDomain() }

        persist(
            ServerSnapshot(
                savedServers: [
                    .test(
                        baseURL: "https://music.local",
                        users: [
                            .test(id: "u1", nickname: "One"),
                            .test(id: "u2", nickname: "Two"),
                        ],
                        selectedUserID: "u1"
                    ),
                ],
                selectedServerBaseURL: "https://music.local"
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
                        baseURL: "https://music.local"
                    ),
                ],
                selectedServerBaseURL: "https://music.local"
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
        baseURL: String = "https://music.local",
        users: [ServerUserRecord] = [],
        selectedUserID: String? = nil
    ) -> ServerRecord {
        ServerRecord(
            version: version,
            hostname: hostname,
            imageFileMaxSize: nil,
            audioFileMaxSize: nil,
            videoFileMaxSize: nil,
            baseURL: baseURL,
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
