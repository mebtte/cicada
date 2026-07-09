import XCTest
@testable import Cicada

final class ServerRecordTests: XCTestCase {
    func testUserCountLabel() {
        XCTAssertEqual(makeServer(users: []).userCountLabel, "0 saved users")
        XCTAssertEqual(makeServer(users: [makeUser(id: "u1")]).userCountLabel, "1 saved user")
        XCTAssertEqual(
            makeServer(users: [makeUser(id: "u1"), makeUser(id: "u2")]).userCountLabel,
            "2 saved users"
        )
    }

    func testSelectedUserReturnsMatchingUser() {
        let selected = makeUser(id: "selected", nickname: "Selected")
        let server = makeServer(
            users: [makeUser(id: "other"), selected],
            selectedUserID: selected.id
        )

        XCTAssertEqual(server.selectedUser, selected)
    }

    func testServerSnapshotUsesJSONSelectedUserIDKey() throws {
        let server = makeServer(users: [makeUser(id: "u1")], selectedUserID: "u1")
        let data = try JSONEncoder().encode(server)
        let object = try XCTUnwrap(
            JSONSerialization.jsonObject(with: data) as? [String: Any]
        )

        XCTAssertEqual(object["selectedUserId"] as? String, "u1")
        XCTAssertNil(object["selectedUserID"])
    }
}

private func makeServer(
    users: [ServerUserRecord],
    selectedUserID: String? = nil
) -> ServerRecord {
    ServerRecord(
        version: "3.6.0",
        hostname: "music.local",
        imageFileMaxSize: nil,
        audioFileMaxSize: nil,
        videoFileMaxSize: nil,
        origin: "https://music.local",
        users: users,
        selectedUserID: selectedUserID
    )
}

private func makeUser(
    id: String,
    nickname: String = "User"
) -> ServerUserRecord {
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
