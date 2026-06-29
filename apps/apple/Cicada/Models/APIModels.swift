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

    init(
        id: String,
        nickname: String,
        avatar: String,
        accepted: Bool? = nil
    ) {
        self.id = id
        self.nickname = nickname
        self.avatar = avatar
        self.accepted = accepted
    }

    enum CodingKeys: String, CodingKey {
        case id
        case nickname
        case avatar
        case accepted
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        nickname = try container.decode(String.self, forKey: .nickname)
        avatar = try container.decodeIfPresent(String.self, forKey: .avatar) ?? ""
        if container.contains(.accepted) {
            accepted = try container.decodeFlexibleBool(forKey: .accepted)
        } else {
            accepted = nil
        }
    }
}

struct ArtistSummary: Decodable, Hashable, Identifiable {
    let id: String
    let name: String
    let aliases: [String]
    var avatar: String?

    init(id: String, name: String, aliases: [String] = [], avatar: String? = nil) {
        self.id = id
        self.name = name
        self.aliases = aliases
        self.avatar = avatar
    }

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

    init(
        id: String,
        name: String,
        aliases: [String] = [],
        musicCount: Int = 0,
        photos: [ArtistPhoto] = []
    ) {
        self.id = id
        self.name = name
        self.aliases = aliases
        self.musicCount = musicCount
        self.photos = photos
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

    init(
        id: String,
        type: Int,
        name: String,
        aliases: [String],
        cover: String,
        coverThumbnail: String?,
        asset: String,
        performers: [ArtistSummary],
        lyricists: [ArtistSummary],
        composers: [ArtistSummary]
    ) {
        self.id = id
        self.type = type
        self.name = name
        self.aliases = aliases
        self.cover = cover
        self.coverThumbnail = coverThumbnail
        self.asset = asset
        self.performers = performers
        self.lyricists = lyricists
        self.composers = composers
    }

    init(detail: MusicDetail) {
        func summaries(_ items: [ArtistSearchItem]) -> [ArtistSummary] {
            items.map { ArtistSummary(id: $0.id, name: $0.name, aliases: $0.aliases, avatar: $0.avatar) }
        }
        self.init(
            id: detail.id,
            type: detail.type,
            name: detail.name,
            aliases: detail.aliases,
            cover: detail.cover,
            coverThumbnail: detail.coverThumbnail,
            asset: detail.asset,
            performers: summaries(detail.performers),
            lyricists: summaries(detail.lyricists),
            composers: summaries(detail.composers)
        )
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

struct PublicMusicbillSearchItem: Decodable, Hashable, Identifiable {
    let id: String
    let name: String
    var cover: String
    let musicCount: Int
    let collectionCount: Int
    var user: MusicbillUser

    init(
        id: String,
        name: String,
        cover: String,
        musicCount: Int,
        collectionCount: Int,
        user: MusicbillUser
    ) {
        self.id = id
        self.name = name
        self.cover = cover
        self.musicCount = musicCount
        self.collectionCount = collectionCount
        self.user = user
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case cover
        case musicCount
        case collectionCount
        case user
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        cover = try container.decodeIfPresent(String.self, forKey: .cover) ?? ""
        musicCount = try container.decodeIfPresent(Int.self, forKey: .musicCount) ?? 0
        collectionCount = try container.decodeIfPresent(Int.self, forKey: .collectionCount) ?? 0
        user = try container.decode(MusicbillUser.self, forKey: .user)
    }
}

struct PublicMusicbillSearchResponse: Decodable, Hashable {
    let total: Int
    var musicbillList: [PublicMusicbillSearchItem]
}

struct PublicMusicbillCollectionItem: Decodable, Hashable, Identifiable {
    let id: String
    let name: String
    var cover: String
    let musicCount: Int
    var user: MusicbillUser

    var searchItem: PublicMusicbillSearchItem {
        PublicMusicbillSearchItem(
            id: id,
            name: name,
            cover: cover,
            musicCount: musicCount,
            collectionCount: 0,
            user: user
        )
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case cover
        case musicCount
        case user
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        cover = try container.decodeIfPresent(String.self, forKey: .cover) ?? ""
        musicCount = try container.decodeIfPresent(Int.self, forKey: .musicCount) ?? 0
        user = try container.decode(MusicbillUser.self, forKey: .user)
    }
}

struct PublicMusicbillCollectionResponse: Decodable, Hashable {
    let total: Int
    var collectionList: [PublicMusicbillCollectionItem]
}

struct SharedMusicbillInvitation: Decodable, Hashable, Identifiable {
    let id: Int
    let inviteTimestamp: TimeInterval
    let inviteUserID: String
    let inviteUserNickname: String
    let musicbillID: String
    let musicbillName: String

    enum CodingKeys: String, CodingKey {
        case id
        case inviteTimestamp
        case inviteUserID = "inviteUserId"
        case inviteUserNickname
        case musicbillID = "musicbillId"
        case musicbillName
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(Int.self, forKey: .id)
        inviteTimestamp = try container.decode(TimeInterval.self, forKey: .inviteTimestamp)
        inviteUserID = try container.decode(String.self, forKey: .inviteUserID)
        inviteUserNickname = try container.decode(String.self, forKey: .inviteUserNickname)
        musicbillID = try container.decode(String.self, forKey: .musicbillID)
        musicbillName = try container.decodeIfPresent(String.self, forKey: .musicbillName) ?? ""
    }
}

struct UserPublicMusicbill: Decodable, Hashable, Identifiable {
    let id: String
    var cover: String
    let name: String
    let musicCount: Int

    func searchItem(user: MusicbillUser) -> PublicMusicbillSearchItem {
        PublicMusicbillSearchItem(
            id: id,
            name: name,
            cover: cover,
            musicCount: musicCount,
            collectionCount: 0,
            user: user
        )
    }

    enum CodingKeys: String, CodingKey {
        case id
        case cover
        case name
        case musicCount
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        cover = try container.decodeIfPresent(String.self, forKey: .cover) ?? ""
        name = try container.decode(String.self, forKey: .name)
        musicCount = try container.decodeIfPresent(Int.self, forKey: .musicCount) ?? 0
    }
}

struct UserDetail: Decodable, Hashable, Identifiable {
    let id: String
    var avatar: String
    let joinTimestamp: TimeInterval
    let nickname: String
    let username: String
    var musicbillList: [UserPublicMusicbill]

    var musicbillUser: MusicbillUser {
        MusicbillUser(
            id: id,
            nickname: nickname,
            avatar: avatar,
            accepted: nil
        )
    }

    enum CodingKeys: String, CodingKey {
        case id
        case avatar
        case joinTimestamp
        case nickname
        case username
        case musicbillList
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        avatar = try container.decodeIfPresent(String.self, forKey: .avatar) ?? ""
        joinTimestamp = try container.decode(TimeInterval.self, forKey: .joinTimestamp)
        nickname = try container.decode(String.self, forKey: .nickname)
        username = try container.decode(String.self, forKey: .username)
        musicbillList = try container.decodeIfPresent([UserPublicMusicbill].self, forKey: .musicbillList) ?? []
    }
}

struct AuthSession: Decodable, Hashable, Identifiable {
    let id: String
    let deviceName: String
    let createTimestamp: TimeInterval
    let lastSeenTimestamp: TimeInterval
    let inactiveExpireTimestamp: TimeInterval
    let current: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case deviceName
        case createTimestamp
        case lastSeenTimestamp
        case inactiveExpireTimestamp
        case current
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        deviceName = try container.decodeIfPresent(String.self, forKey: .deviceName) ?? ""
        createTimestamp = try container.decode(TimeInterval.self, forKey: .createTimestamp)
        lastSeenTimestamp = try container.decode(TimeInterval.self, forKey: .lastSeenTimestamp)
        inactiveExpireTimestamp = try container.decode(TimeInterval.self, forKey: .inactiveExpireTimestamp)
        current = try container.decodeFlexibleBool(forKey: .current)
    }
}

struct PublicMusicbillDetail: Decodable, Hashable, Identifiable {
    let id: String
    var cover: String
    let name: String
    let isPublic: Bool
    var user: MusicbillUser
    var musicList: [Music]
    var collected: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case cover
        case name
        case isPublic = "public"
        case user
        case musicList
        case collected
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        cover = try container.decodeIfPresent(String.self, forKey: .cover) ?? ""
        name = try container.decode(String.self, forKey: .name)
        isPublic = try container.decodeFlexibleBool(forKey: .isPublic)
        user = try container.decode(MusicbillUser.self, forKey: .user)
        musicList = try container.decodeIfPresent([Music].self, forKey: .musicList) ?? []
        collected = try container.decodeFlexibleBool(forKey: .collected)
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

struct MusicDetail: Decodable, Hashable, Identifiable {
    let id: String
    let type: Int
    let name: String
    let aliases: [String]
    var cover: String
    var coverThumbnail: String?
    var asset: String
    let heat: Int
    let createTimestamp: TimeInterval
    let year: Int?
    let assetDurationMs: Int?
    let assetCodec: String?
    let assetBitRate: Int?
    let musicbillCount: Int
    var relatedPublicMusicbillList: [PublicMusicbillSearchItem]
    var performers: [ArtistSearchItem]
    var lyricists: [ArtistSearchItem]
    var composers: [ArtistSearchItem]

    enum CodingKeys: String, CodingKey {
        case id
        case type
        case name
        case aliases
        case cover
        case coverThumbnail
        case asset
        case heat
        case createTimestamp
        case year
        case assetDurationMs
        case assetCodec
        case assetBitRate
        case musicbillCount
        case relatedPublicMusicbillList
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
        heat = try container.decodeIfPresent(Int.self, forKey: .heat) ?? 0
        createTimestamp = try container.decodeIfPresent(TimeInterval.self, forKey: .createTimestamp) ?? 0
        year = try container.decodeIfPresent(Int.self, forKey: .year)
        assetDurationMs = try container.decodeIfPresent(Int.self, forKey: .assetDurationMs)
        assetCodec = try container.decodeIfPresent(String.self, forKey: .assetCodec)
        assetBitRate = try container.decodeIfPresent(Int.self, forKey: .assetBitRate)
        musicbillCount = try container.decodeIfPresent(Int.self, forKey: .musicbillCount) ?? 0
        relatedPublicMusicbillList = try container.decodeIfPresent([PublicMusicbillSearchItem].self, forKey: .relatedPublicMusicbillList) ?? []
        performers = try container.decodeIfPresent([ArtistSearchItem].self, forKey: .performers) ?? []
        lyricists = try container.decodeIfPresent([ArtistSearchItem].self, forKey: .lyricists) ?? []
        composers = try container.decodeIfPresent([ArtistSearchItem].self, forKey: .composers) ?? []
    }
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

struct ExplorationMusicItem: Decodable, Hashable, Identifiable {
    let id: String
    let name: String
    var cover: String
    var coverThumbnail: String?
    let performers: [ArtistSummary]

    var performerLine: String {
        let names = performers.map(\.name)
        return names.isEmpty ? "Unknown Artist" : names.joined(separator: ", ")
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case cover
        case coverThumbnail
        case performers
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        cover = try container.decodeIfPresent(String.self, forKey: .cover) ?? ""
        coverThumbnail = try container.decodeIfPresent(String.self, forKey: .coverThumbnail)
        performers = try container.decodeIfPresent([ArtistSummary].self, forKey: .performers) ?? []
    }
}

struct ExplorationArtistItem: Decodable, Hashable, Identifiable {
    let id: String
    let name: String
    var photos: [ArtistPhoto]

    var avatar: String {
        photos.first?.asset ?? ""
    }

    func asSearchItem() -> ArtistSearchItem {
        ArtistSearchItem(id: id, name: name, aliases: [], musicCount: 0, photos: photos)
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case photos
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        photos = try container.decodeIfPresent([ArtistPhoto].self, forKey: .photos) ?? []
    }
}

struct ExplorationPublicMusicbillItem: Decodable, Hashable, Identifiable {
    let id: String
    let name: String
    var cover: String
    var user: MusicbillUser

    func asSearchItem() -> PublicMusicbillSearchItem {
        PublicMusicbillSearchItem(
            id: id,
            name: name,
            cover: cover,
            musicCount: 0,
            collectionCount: 0,
            user: user
        )
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case cover
        case user
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        cover = try container.decodeIfPresent(String.self, forKey: .cover) ?? ""
        user = try container.decode(MusicbillUser.self, forKey: .user)
    }
}

struct ExplorationData: Decodable, Hashable {
    var musicList: [ExplorationMusicItem]
    var artistList: [ExplorationArtistItem]
    var publicMusicbillList: [ExplorationPublicMusicbillItem]
    var recentMusicList: [ExplorationMusicItem]
    var recentArtistList: [ExplorationArtistItem]
    var recentPublicMusicbillList: [ExplorationPublicMusicbillItem]

    var isEmpty: Bool {
        musicList.isEmpty
            && artistList.isEmpty
            && publicMusicbillList.isEmpty
            && recentMusicList.isEmpty
            && recentArtistList.isEmpty
            && recentPublicMusicbillList.isEmpty
    }

    enum CodingKeys: String, CodingKey {
        case musicList
        case artistList
        case publicMusicbillList
        case recentMusicList
        case recentArtistList
        case recentPublicMusicbillList
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        musicList = try container.decodeIfPresent([ExplorationMusicItem].self, forKey: .musicList) ?? []
        artistList = try container.decodeIfPresent([ExplorationArtistItem].self, forKey: .artistList) ?? []
        publicMusicbillList = try container.decodeIfPresent([ExplorationPublicMusicbillItem].self, forKey: .publicMusicbillList) ?? []
        recentMusicList = try container.decodeIfPresent([ExplorationMusicItem].self, forKey: .recentMusicList) ?? []
        recentArtistList = try container.decodeIfPresent([ExplorationArtistItem].self, forKey: .recentArtistList) ?? []
        recentPublicMusicbillList = try container.decodeIfPresent([ExplorationPublicMusicbillItem].self, forKey: .recentPublicMusicbillList) ?? []
    }
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
