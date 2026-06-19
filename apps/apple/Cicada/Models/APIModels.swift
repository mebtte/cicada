import Foundation

struct EmptyResponse: Decodable {}

struct CaptchaResponse: Decodable {
    let id: String
    let svg: String
}

struct LoginResponse: Decodable {
    let token: String
    let sessionID: String

    enum CodingKeys: String, CodingKey {
        case token
        case sessionID = "sessionId"
    }
}

struct UserProfile: Decodable {
    let id: String
    let username: String
    var avatar: String
    let nickname: String
    let joinTimestamp: TimeInterval
    let admin: Bool
    let musicbillOrdersJSON: String?
    let lastActiveTimestamp: TimeInterval
    let twoFAEnabled: Bool

    var musicbillOrders: [String] {
        guard
            let data = musicbillOrdersJSON?.data(using: .utf8),
            let orders = try? JSONDecoder().decode([String].self, from: data)
        else {
            return []
        }
        return orders
    }

    enum CodingKeys: String, CodingKey {
        case id
        case username
        case avatar
        case nickname
        case joinTimestamp
        case admin
        case musicbillOrdersJSON
        case lastActiveTimestamp
        case twoFAEnabled
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        username = try container.decode(String.self, forKey: .username)
        avatar = try container.decodeIfPresent(String.self, forKey: .avatar) ?? ""
        nickname = try container.decode(String.self, forKey: .nickname)
        joinTimestamp = try container.decode(TimeInterval.self, forKey: .joinTimestamp)
        admin = try container.decodeFlexibleBool(forKey: .admin)
        musicbillOrdersJSON = try container.decodeIfPresent(String.self, forKey: .musicbillOrdersJSON)
        lastActiveTimestamp = try container.decode(TimeInterval.self, forKey: .lastActiveTimestamp)
        twoFAEnabled = try container.decodeFlexibleBool(forKey: .twoFAEnabled)
    }
}

struct MusicbillUser: Decodable, Hashable, Identifiable {
    let id: String
    let nickname: String
    var avatar: String
    var accepted: Bool?
}

struct ArtistSummary: Decodable, Hashable, Identifiable {
    let id: String
    let name: String
    let aliases: [String]
    var avatar: String?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case aliases
        case avatar
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        aliases = try container.decodeIfPresent([String].self, forKey: .aliases) ?? []
        avatar = try container.decodeIfPresent(String.self, forKey: .avatar)
    }
}

struct ArtistPhoto: Decodable, Hashable, Identifiable {
    let id: String
    var asset: String
    var thumbnail: String?
    let description: String

    enum CodingKeys: String, CodingKey {
        case id
        case asset
        case thumbnail
        case description
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        asset = try container.decodeIfPresent(String.self, forKey: .asset) ?? ""
        thumbnail = try container.decodeIfPresent(String.self, forKey: .thumbnail)
        description = try container.decodeIfPresent(String.self, forKey: .description) ?? ""
    }
}

struct ArtistSearchItem: Decodable, Hashable, Identifiable {
    let id: String
    let name: String
    let aliases: [String]
    let musicCount: Int
    var photos: [ArtistPhoto]

    var avatar: String {
        photos.first?.asset ?? ""
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case aliases
        case musicCount
        case photos
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        aliases = try container.decodeIfPresent([String].self, forKey: .aliases) ?? []
        musicCount = try container.decodeIfPresent(Int.self, forKey: .musicCount) ?? 0
        photos = try container.decodeIfPresent([ArtistPhoto].self, forKey: .photos) ?? []
    }
}

struct ArtistSearchResponse: Decodable, Hashable {
    let total: Int
    var artistList: [ArtistSearchItem]
}

struct Music: Decodable, Hashable, Identifiable {
    let id: String
    let type: Int
    let name: String
    let aliases: [String]
    var cover: String
    var coverThumbnail: String?
    var asset: String
    let performers: [ArtistSummary]
    let lyricists: [ArtistSummary]
    let composers: [ArtistSummary]

    var performerLine: String {
        let names = performers.map(\.name)
        return names.isEmpty ? "Unknown Artist" : names.joined(separator: ", ")
    }

    enum CodingKeys: String, CodingKey {
        case id
        case type
        case name
        case aliases
        case cover
        case coverThumbnail
        case asset
        case performers
        case lyricists
        case composers
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        type = try container.decode(Int.self, forKey: .type)
        name = try container.decode(String.self, forKey: .name)
        aliases = try container.decodeIfPresent([String].self, forKey: .aliases) ?? []
        cover = try container.decodeIfPresent(String.self, forKey: .cover) ?? ""
        coverThumbnail = try container.decodeIfPresent(String.self, forKey: .coverThumbnail)
        asset = try container.decodeIfPresent(String.self, forKey: .asset) ?? ""
        performers = try container.decodeIfPresent([ArtistSummary].self, forKey: .performers) ?? []
        lyricists = try container.decodeIfPresent([ArtistSummary].self, forKey: .lyricists) ?? []
        composers = try container.decodeIfPresent([ArtistSummary].self, forKey: .composers) ?? []
    }
}

struct MusicbillSummary: Decodable, Hashable, Identifiable {
    let id: String
    var cover: String
    let name: String
    let isPublic: Bool
    let createTimestamp: TimeInterval
    var owner: MusicbillUser
    var sharedUserList: [MusicbillUser]

    enum CodingKeys: String, CodingKey {
        case id
        case cover
        case name
        case isPublic = "public"
        case createTimestamp
        case owner
        case sharedUserList
    }
}

struct MusicbillDetail: Decodable, Hashable, Identifiable {
    let id: String
    var cover: String
    let name: String
    let isPublic: Bool
    let createTimestamp: TimeInterval
    var owner: MusicbillUser
    var sharedUserList: [MusicbillUser]
    var musicList: [Music]

    enum CodingKeys: String, CodingKey {
        case id
        case cover
        case name
        case isPublic = "public"
        case createTimestamp
        case owner
        case sharedUserList
        case musicList
    }
}

struct MusicSearchResponse: Decodable, Hashable {
    let total: Int
    var musicList: [Music]
}

struct MusicWithLyrics: Decodable, Hashable, Identifiable {
    var music: Music
    let lyrics: [LyricItem]

    var id: Music.ID {
        music.id
    }

    enum CodingKeys: String, CodingKey {
        case lyrics
    }

    init(from decoder: Decoder) throws {
        music = try Music(from: decoder)
        let container = try decoder.container(keyedBy: CodingKeys.self)
        lyrics = try container.decodeIfPresent([LyricItem].self, forKey: .lyrics) ?? []
    }
}

struct LyricSearchResponse: Decodable, Hashable {
    let total: Int
    var musicList: [MusicWithLyrics]
}

struct ArtistDetail: Decodable, Hashable, Identifiable {
    let id: String
    let name: String
    let aliases: [String]
    var photos: [ArtistPhoto]
    var performerMusicList: [Music]
    var lyricistMusicList: [Music]
    var composerMusicList: [Music]

    var avatar: String {
        photos.first?.asset ?? ""
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case aliases
        case photos
        case performerMusicList
        case lyricistMusicList
        case composerMusicList
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        aliases = try container.decodeIfPresent([String].self, forKey: .aliases) ?? []
        photos = try container.decodeIfPresent([ArtistPhoto].self, forKey: .photos) ?? []
        performerMusicList = try container.decodeIfPresent([Music].self, forKey: .performerMusicList) ?? []
        lyricistMusicList = try container.decodeIfPresent([Music].self, forKey: .lyricistMusicList) ?? []
        composerMusicList = try container.decodeIfPresent([Music].self, forKey: .composerMusicList) ?? []
    }
}

struct LyricItem: Decodable, Hashable, Identifiable {
    let id: Int
    let lrc: String
}

struct CreateMusicPlayRecordPayload: Encodable, Sendable {
    let musicId: String
    let clientRecordId: String
    let percent: Double
    let playedAt: Int64
}

extension KeyedDecodingContainer {
    func decodeFlexibleBool(forKey key: Key) throws -> Bool {
        if let value = try? decode(Bool.self, forKey: key) {
            return value
        }
        if let value = try? decode(Int.self, forKey: key) {
            return value != 0
        }
        if let value = try? decode(String.self, forKey: key) {
            return value == "1" || value.lowercased() == "true"
        }
        return false
    }
}
