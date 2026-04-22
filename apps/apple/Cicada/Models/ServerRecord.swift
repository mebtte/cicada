import Foundation

struct ServerUserRecord: Codable, Hashable, Identifiable {
    let id: String
    var username: String
    var avatar: String
    var nickname: String
    var joinTimestamp: TimeInterval
    var admin: Bool
    var musicbillOrders: [String]
    var musicbillMaxAmount: Int
    var createMusicMaxAmountPerDay: Int
    var musicPlayRecordIndate: Int
    var twoFAEnabled: Bool
    var token: String
}

struct ServerRecord: Codable, Hashable, Identifiable {
    let version: String
    let hostname: String
    let origin: String
    var users: [ServerUserRecord]
    var selectedUserID: String?

    var id: String { origin }

    var userCountLabel: String {
        switch users.count {
        case 1:
            return "1 saved user"
        default:
            return "\(users.count) saved users"
        }
    }

    enum CodingKeys: String, CodingKey {
        case version
        case hostname
        case origin
        case users
        case selectedUserID = "selectedUserId"
    }
}

struct ServerSnapshot: Codable {
    var savedServers: [ServerRecord]
    var selectedServerOrigin: String?
}
