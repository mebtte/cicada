import Foundation

struct ServerUserRecord: Codable, Hashable, Identifiable {
    let id: String
    var username: String
    var avatar: String
    var nickname: String
    var joinTimestamp: TimeInterval
    var admin: Bool
    var musicbillOrders: [String]
    var twoFAEnabled: Bool
    var token: String
    var sessionID: String?

    enum CodingKeys: String, CodingKey {
        case id
        case username
        case avatar
        case nickname
        case joinTimestamp
        case admin
        case musicbillOrders
        case twoFAEnabled
        case token
        case sessionID = "sessionId"
    }
}

struct ServerRecord: Codable, Hashable, Identifiable {
    let version: String
    let hostname: String
    var imageFileMaxSize: Int?
    var audioFileMaxSize: Int?
    var videoFileMaxSize: Int?
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

    var selectedUser: ServerUserRecord? {
        guard let selectedUserID else { return nil }
        return users.first(where: { $0.id == selectedUserID })
    }

    enum CodingKeys: String, CodingKey {
        case version
        case hostname
        case imageFileMaxSize
        case audioFileMaxSize
        case videoFileMaxSize
        case origin
        case users
        case selectedUserID = "selectedUserId"
    }
}

struct ServerSnapshot: Codable {
    var savedServers: [ServerRecord]
    var selectedServerOrigin: String?
}
