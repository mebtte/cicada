import Foundation

enum CicadaAPIQuery {
    static let clientLanguage = "__client_language"

    /// Keep protocol-level parameters in one place so every API client sends
    /// the same optional language preference.
    static func commonItems(_ storage: UserDefaults = .standard) -> [URLQueryItem] {
        [
            URLQueryItem(
                name: clientLanguage,
                value: AppSettingsSnapshot.clientLanguageQueryValue(storage)
            )
        ]
    }
}

enum CicadaAPIError: LocalizedError, Equatable {
    case invalidURL
    case invalidResponse
    case httpStatus(Int)
    case business(code: String, message: String)
    case missingPayload

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "The server URL is invalid."
        case .invalidResponse:
            return "The server returned an invalid response."
        case .httpStatus(let statusCode):
            return "The server responded with HTTP \(statusCode)."
        case .business(_, let message):
            return message
        case .missingPayload:
            return "The server response was empty."
        }
    }

    var businessCode: String? {
        guard case .business(let code, _) = self else {
            return nil
        }
        return code
    }

    static func isNotAuthorized(_ error: Error) -> Bool {
        (error as? CicadaAPIError)?.businessCode == "not_authorized"
    }
}

struct CicadaAPIClient: Sendable {
    private static let tokenHeader = "x-cicada-token"

    let origin: String
    let token: String?

    init(origin: String, token: String? = nil) {
        self.origin = origin
        self.token = token
    }

    init(server: ServerRecord, user: ServerUserRecord? = nil) {
        self.init(origin: server.origin, token: user?.token)
    }

    func getCaptcha() async throws -> CaptchaResponse {
        try await request(path: "/api/base/captcha", requiresToken: false)
    }

    func login(
        username: String,
        password: String,
        captchaID: String,
        captchaValue: String,
        deviceName: String
    ) async throws -> LoginResponse {
        try await request(
            path: "/api/base/login",
            method: "POST",
            body: LoginBody(
                username: username,
                password: password,
                captchaId: captchaID,
                captchaValue: captchaValue,
                deviceName: deviceName
            ),
            requiresToken: false
        )
    }

    func loginWith2FA(
        username: String,
        password: String,
        twoFAToken: String,
        deviceName: String
    ) async throws -> LoginResponse {
        try await request(
            path: "/api/base/login_with_2fa",
            method: "POST",
            body: LoginWith2FABody(
                username: username,
                password: password,
                twoFAToken: twoFAToken,
                deviceName: deviceName
            ),
            requiresToken: false
        )
    }

    func getProfile(token overrideToken: String? = nil) async throws -> UserProfile {
        var profile: UserProfile = try await request(
            path: "/api/common/profile",
            tokenOverride: overrideToken,
            requiresToken: true
        )
        profile.avatar = absoluteURLString(profile.avatar)
        return profile
    }

    func updateProfileNickname(_ nickname: String) async throws {
        let _: EmptyResponse = try await request(
            path: "/api/common/profile",
            method: "PUT",
            body: UpdateProfileBody(key: "nickname", value: nickname)
        )
    }

    func updateProfilePassword(
        password: String,
        credential: String
    ) async throws {
        let _: EmptyResponse = try await request(
            path: "/api/common/profile",
            method: "PUT",
            body: UpdateProfileBody(
                key: "password",
                value: UpdateProfilePasswordValue(
                    password: password,
                    currentPassword: credential,
                    twoFAToken: credential
                )
            )
        )
    }

    func getUser(id: String) async throws -> UserDetail {
        var user: UserDetail = try await request(
            path: "/api/common/user",
            query: ["userId": id]
        )
        user.avatar = absoluteURLString(user.avatar)
        for index in user.musicbillList.indices {
            user.musicbillList[index].cover = absoluteURLString(user.musicbillList[index].cover)
            user.musicbillList[index].coverThumbnail = absoluteURLString(user.musicbillList[index].coverThumbnail)
        }
        return user
    }

    func getMusicbillList() async throws -> [MusicbillSummary] {
        var musicbills: [MusicbillSummary] = try await request(path: "/api/common/musicbill_list")
        for index in musicbills.indices {
            var musicbill = musicbills[index]
            musicbill.cover = absoluteURLString(musicbill.cover)
            musicbill.coverThumbnail = absoluteURLString(musicbill.coverThumbnail)
            normalizeUserAssets(&musicbill.owner, sharedUsers: &musicbill.sharedUserList)
            musicbills[index] = musicbill
        }
        return musicbills
    }

    func getMusicbill(id: String) async throws -> MusicbillDetail {
        var musicbill: MusicbillDetail = try await request(
            path: "/api/common/musicbill",
            query: ["id": id]
        )
        musicbill.cover = absoluteURLString(musicbill.cover)
        musicbill.coverThumbnail = absoluteURLString(musicbill.coverThumbnail)
        var owner = musicbill.owner
        var sharedUserList = musicbill.sharedUserList
        normalizeUserAssets(&owner, sharedUsers: &sharedUserList)
        musicbill.owner = owner
        musicbill.sharedUserList = sharedUserList
        for index in musicbill.musicList.indices {
            normalizeMusicAssets(&musicbill.musicList[index])
        }
        return musicbill
    }

    func searchPublicMusicbill(keyword: String, page: Int, pageSize: Int) async throws -> PublicMusicbillSearchResponse {
        var result: PublicMusicbillSearchResponse = try await request(
            path: "/api/common/public_musicbill/search",
            query: [
                "keyword": keyword,
                "page": String(page),
                "pageSize": String(pageSize),
            ]
        )
        for index in result.musicbillList.indices {
            result.musicbillList[index].cover = absoluteURLString(result.musicbillList[index].cover)
            result.musicbillList[index].coverThumbnail = absoluteURLString(result.musicbillList[index].coverThumbnail)
            result.musicbillList[index].user.avatar = absoluteURLString(result.musicbillList[index].user.avatar)
        }
        return result
    }

    func getPublicMusicbill(id: String) async throws -> PublicMusicbillDetail {
        var musicbill: PublicMusicbillDetail = try await request(
            path: "/api/common/public_musicbill",
            query: ["id": id]
        )
        musicbill.cover = absoluteURLString(musicbill.cover)
        musicbill.coverThumbnail = absoluteURLString(musicbill.coverThumbnail)
        musicbill.user.avatar = absoluteURLString(musicbill.user.avatar)
        normalizeMusicListAssets(&musicbill.musicList)
        return musicbill
    }

    func getPublicMusicbillCollectionList(
        keyword: String,
        page: Int,
        pageSize: Int
    ) async throws -> PublicMusicbillCollectionResponse {
        var result: PublicMusicbillCollectionResponse = try await request(
            path: "/api/common/public_musicbill_collection_list",
            query: [
                "keyword": keyword,
                "page": String(page),
                "pageSize": String(pageSize),
            ]
        )
        for index in result.collectionList.indices {
            result.collectionList[index].cover = absoluteURLString(result.collectionList[index].cover)
            result.collectionList[index].coverThumbnail = absoluteURLString(result.collectionList[index].coverThumbnail)
            result.collectionList[index].user.avatar = absoluteURLString(result.collectionList[index].user.avatar)
        }
        return result
    }

    func createMusicbill(name: String) async throws -> String {
        try await request(
            path: "/api/common/musicbill",
            method: "POST",
            body: CreateMusicbillBody(name: name)
        )
    }

    func updateMusicbillName(id: String, name: String) async throws {
        let _: EmptyResponse = try await request(
            path: "/api/common/musicbill",
            method: "PUT",
            body: UpdateMusicbillStringBody(id: id, key: "name", value: name)
        )
    }

    func updateMusicbillPublic(
        id: String,
        isPublic: Bool,
        captchaID: String? = nil,
        captchaValue: String? = nil
    ) async throws {
        let _: EmptyResponse = try await request(
            path: "/api/common/musicbill",
            method: "PUT",
            body: UpdateMusicbillBoolBody(
                id: id,
                key: "public",
                value: isPublic,
                captchaId: captchaID,
                captchaValue: captchaValue
            )
        )
    }

    func deleteMusicbill(
        id: String,
        captchaID: String,
        captchaValue: String
    ) async throws {
        let _: EmptyResponse = try await request(
            path: "/api/common/musicbill",
            method: "DELETE",
            query: [
                "id": id,
                "captchaId": captchaID,
                "captchaValue": captchaValue,
            ]
        )
    }

    func addMusicToMusicbill(musicbillID: String, musicID: String) async throws {
        let _: EmptyResponse = try await request(
            path: "/api/common/musicbill_music",
            method: "POST",
            body: MusicbillMusicBody(
                musicbillId: musicbillID,
                musicId: musicID
            )
        )
    }

    func removeMusicFromMusicbill(musicbillID: String, musicID: String) async throws {
        let _: EmptyResponse = try await request(
            path: "/api/common/musicbill_music",
            method: "DELETE",
            query: [
                "musicbillId": musicbillID,
                "musicId": musicID,
            ]
        )
    }

    func addMusicbillSharedUser(musicbillID: String, username: String) async throws {
        let _: EmptyResponse = try await request(
            path: "/api/common/musicbill/shared_user",
            method: "POST",
            body: AddMusicbillSharedUserBody(
                musicbillId: musicbillID,
                username: username
            )
        )
    }

    func deleteMusicbillSharedUser(musicbillID: String, userID: String) async throws {
        let _: EmptyResponse = try await request(
            path: "/api/common/musicbill/shared_user",
            method: "DELETE",
            query: [
                "musicbillId": musicbillID,
                "userId": userID,
            ]
        )
    }

    func getLyricList(musicID: String) async throws -> [LyricItem] {
        try await request(
            path: "/api/common/lyric_list",
            query: ["musicId": musicID]
        )
    }

    func searchMusic(keyword: String, page: Int, pageSize: Int) async throws -> MusicSearchResponse {
        var result: MusicSearchResponse = try await request(
            path: "/api/common/music/search",
            query: [
                "keyword": keyword,
                "page": String(page),
                "pageSize": String(pageSize),
            ]
        )
        for index in result.musicList.indices {
            normalizeMusicAssets(&result.musicList[index])
        }
        return result
    }

    func searchMusicByLyric(keyword: String, page: Int, pageSize: Int) async throws -> LyricSearchResponse {
        var result: LyricSearchResponse = try await request(
            path: "/api/common/music/search_by_lyric",
            query: [
                "keyword": keyword,
                "page": String(page),
                "pageSize": String(pageSize),
            ]
        )
        for index in result.musicList.indices {
            normalizeMusicAssets(&result.musicList[index].music)
        }
        return result
    }

    func getMusic(id: String) async throws -> MusicDetail {
        var music: MusicDetail = try await request(
            path: "/api/common/music",
            query: ["id": id]
        )
        music.cover = absoluteURLString(music.cover)
        music.coverThumbnail = absoluteURLString(music.coverThumbnail)
        music.asset = absoluteURLString(music.asset)
        normalizeArtistSearchItems(&music.performers)
        normalizeArtistSearchItems(&music.lyricists)
        normalizeArtistSearchItems(&music.composers)
        for index in music.relatedPublicMusicbillList.indices {
            music.relatedPublicMusicbillList[index].cover = absoluteURLString(music.relatedPublicMusicbillList[index].cover)
            music.relatedPublicMusicbillList[index].coverThumbnail = absoluteURLString(music.relatedPublicMusicbillList[index].coverThumbnail)
            music.relatedPublicMusicbillList[index].user.avatar = absoluteURLString(music.relatedPublicMusicbillList[index].user.avatar)
        }
        return music
    }

    func searchArtist(keyword: String, page: Int, pageSize: Int) async throws -> ArtistSearchResponse {
        var result: ArtistSearchResponse = try await request(
            path: "/api/common/artist/search",
            query: [
                "keyword": keyword,
                "page": String(page),
                "pageSize": String(pageSize),
            ]
        )
        for index in result.artistList.indices {
            normalizeArtistPhotos(&result.artistList[index].photos)
        }
        return result
    }

    func getArtist(id: String) async throws -> ArtistDetail {
        var artist: ArtistDetail = try await request(
            path: "/api/common/artist",
            query: ["id": id]
        )
        normalizeArtistPhotos(&artist.photos)
        normalizeMusicListAssets(&artist.performerMusicList)
        normalizeMusicListAssets(&artist.lyricistMusicList)
        normalizeMusicListAssets(&artist.composerMusicList)
        return artist
    }

    func collectPublicMusicbill(id: String) async throws {
        let _: EmptyResponse = try await request(
            path: "/api/common/public_musicbill/collection",
            method: "POST",
            body: PublicMusicbillCollectionBody(id: id)
        )
    }

    func uncollectPublicMusicbill(id: String) async throws {
        let _: EmptyResponse = try await request(
            path: "/api/common/public_musicbill/collection",
            method: "DELETE",
            query: ["id": id]
        )
    }

    func getSharedMusicbillInvitationList() async throws -> [SharedMusicbillInvitation] {
        try await request(path: "/api/common/shared_musicbill_invitation_list")
    }

    func acceptSharedMusicbillInvitation(id: Int) async throws {
        let _: EmptyResponse = try await request(
            path: "/api/common/shared_musicbill_invitation",
            method: "PUT",
            body: SharedMusicbillInvitationBody(id: id)
        )
    }

    func getExploration() async throws -> ExplorationData {
        var data: ExplorationData = try await request(path: "/api/common/exploration")
        normalizeExplorationMusic(&data.musicList)
        normalizeExplorationMusic(&data.recentMusicList)
        normalizeExplorationArtists(&data.artistList)
        normalizeExplorationArtists(&data.recentArtistList)
        normalizeExplorationMusicbills(&data.publicMusicbillList)
        normalizeExplorationMusicbills(&data.recentPublicMusicbillList)
        return data
    }

    func getRandomMusic(excludeID: String?) async throws -> Music {
        var query: [String: String] = [:]
        if let excludeID, !excludeID.isEmpty {
            query["excludeId"] = excludeID
        }
        var music: Music = try await request(
            path: "/api/common/music/random",
            query: query
        )
        normalizeMusicAssets(&music)
        return music
    }

    func createMusicPlayRecord(_ payload: CreateMusicPlayRecordPayload) async throws {
        let _: EmptyResponse = try await request(
            path: "/api/common/music_play_record",
            method: "POST",
            body: payload
        )
    }

    func deleteCurrentSession() async throws {
        let _: EmptyResponse = try await request(
            path: "/api/common/sessions/current",
            method: "DELETE"
        )
    }

    func getSessions() async throws -> [AuthSession] {
        try await request(path: "/api/common/sessions")
    }

    func updateSession(id: String, deviceName: String) async throws {
        let _: EmptyResponse = try await request(
            path: "/api/common/sessions/\(id)",
            method: "PUT",
            body: UpdateSessionBody(deviceName: deviceName)
        )
    }

    func deleteSession(id: String) async throws {
        let _: EmptyResponse = try await request(
            path: "/api/common/sessions/\(id)",
            method: "DELETE"
        )
    }

    func musicPlaybackURL(for music: Music) -> URL? {
        guard var components = URLComponents(string: music.asset) else {
            return nil
        }
        var queryItems = components.queryItems ?? []
        queryItems.removeAll(where: { $0.name == "quality" })
        queryItems.append(URLQueryItem(name: "quality", value: AppSettingsSnapshot.musicPlaybackQuality()))
        components.queryItems = queryItems
        return components.url
    }

    /// Builds an authenticated request to download a music asset for offline
    /// caching. Reuses `musicPlaybackURL` so the current quality is applied.
    func assetDownloadRequest(for music: Music) -> URLRequest? {
        guard let url = musicPlaybackURL(for: music) else { return nil }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        if let token, !token.isEmpty {
            request.setValue(token, forHTTPHeaderField: Self.tokenHeader)
        }
        return request
    }

    func absoluteURLString(_ rawValue: String?) -> String {
        guard let rawValue else { return "" }
        let trimmed = rawValue.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return "" }

        if trimmed.hasPrefix("http://") || trimmed.hasPrefix("https://") || trimmed.hasPrefix("data:") || trimmed.hasPrefix("blob:") {
            return trimmed
        }

        if trimmed.hasPrefix("//") {
            let scheme = URL(string: origin)?.scheme ?? "https"
            return "\(scheme):\(trimmed)"
        }

        if trimmed.hasPrefix("/") {
            return origin + trimmed
        }

        return origin + "/" + trimmed
    }

    private func request<Data: Decodable>(
        path: String,
        method: String = "GET",
        query: [String: String] = [:],
        tokenOverride: String? = nil,
        requiresToken: Bool = true
    ) async throws -> Data {
        try await performRequest(
            path: path,
            method: method,
            query: query,
            encodedBody: nil,
            tokenOverride: tokenOverride,
            requiresToken: requiresToken
        )
    }

    private func request<Data: Decodable, Body: Encodable>(
        path: String,
        method: String = "GET",
        query: [String: String] = [:],
        body: Body,
        tokenOverride: String? = nil,
        requiresToken: Bool = true
    ) async throws -> Data {
        let encodedBody = try JSONEncoder().encode(body)
        return try await performRequest(
            path: path,
            method: method,
            query: query,
            encodedBody: encodedBody,
            tokenOverride: tokenOverride,
            requiresToken: requiresToken
        )
    }

    private func performRequest<Data: Decodable>(
        path: String,
        method: String,
        query: [String: String],
        encodedBody: Foundation.Data?,
        tokenOverride: String?,
        requiresToken: Bool
    ) async throws -> Data {
        guard let url = makeURL(path: path, query: query) else {
            throw CicadaAPIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 15
        request.cachePolicy = .reloadIgnoringLocalCacheData

        if let encodedBody {
            request.httpBody = encodedBody
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        let requestToken = tokenOverride ?? token
        if requiresToken {
            guard let requestToken, !requestToken.isEmpty else {
                throw CicadaAPIError.business(code: "not_authorized", message: "Not authorized.")
            }
            request.setValue(requestToken, forHTTPHeaderField: Self.tokenHeader)
        } else if let requestToken, !requestToken.isEmpty {
            request.setValue(requestToken, forHTTPHeaderField: Self.tokenHeader)
        }

        let (responseData, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw CicadaAPIError.invalidResponse
        }
        guard httpResponse.statusCode == 200 else {
            throw CicadaAPIError.httpStatus(httpResponse.statusCode)
        }

        let envelope = try JSONDecoder().decode(APIEnvelope<Data>.self, from: responseData)
        guard envelope.code == "success" else {
            throw CicadaAPIError.business(
                code: envelope.code,
                message: envelope.message ?? envelope.code
            )
        }
        if let payload = envelope.data {
            return payload
        }
        if Data.self == EmptyResponse.self {
            return EmptyResponse() as! Data
        }
        throw CicadaAPIError.missingPayload
    }

    private func makeURL(path: String, query: [String: String]) -> URL? {
        guard let baseURL = URL(string: origin) else {
            return nil
        }
        let cleanPath = path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let url = baseURL.appending(path: cleanPath)
        guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            return nil
        }

        var queryItems = query.map {
            URLQueryItem(name: $0.key, value: $0.value)
        }
        queryItems.append(contentsOf: CicadaAPIQuery.commonItems())
        components.queryItems = queryItems

        return components.url
    }

    private func normalizeUserAssets(
        _ owner: inout MusicbillUser,
        sharedUsers: inout [MusicbillUser]
    ) {
        owner.avatar = absoluteURLString(owner.avatar)
        for index in sharedUsers.indices {
            sharedUsers[index].avatar = absoluteURLString(sharedUsers[index].avatar)
        }
    }

    private func normalizeMusicAssets(_ music: inout Music) {
        music.cover = absoluteURLString(music.cover)
        music.coverThumbnail = absoluteURLString(music.coverThumbnail)
        music.asset = absoluteURLString(music.asset)
    }

    private func normalizeMusicListAssets(_ musicList: inout [Music]) {
        for index in musicList.indices {
            normalizeMusicAssets(&musicList[index])
        }
    }

    private func normalizeArtistPhotos(_ photos: inout [ArtistPhoto]) {
        for index in photos.indices {
            photos[index].asset = absoluteURLString(photos[index].asset)
            photos[index].thumbnail = absoluteURLString(photos[index].thumbnail)
        }
    }

    private func normalizeArtistSearchItems(_ artists: inout [ArtistSearchItem]) {
        for index in artists.indices {
            normalizeArtistPhotos(&artists[index].photos)
        }
    }

    private func normalizeExplorationMusic(_ list: inout [ExplorationMusicItem]) {
        for index in list.indices {
            list[index].cover = absoluteURLString(list[index].cover)
            list[index].coverThumbnail = absoluteURLString(list[index].coverThumbnail)
        }
    }

    private func normalizeExplorationArtists(_ list: inout [ExplorationArtistItem]) {
        for index in list.indices {
            normalizeArtistPhotos(&list[index].photos)
        }
    }

    private func normalizeExplorationMusicbills(_ list: inout [ExplorationPublicMusicbillItem]) {
        for index in list.indices {
            list[index].cover = absoluteURLString(list[index].cover)
            list[index].coverThumbnail = absoluteURLString(list[index].coverThumbnail)
            list[index].user.avatar = absoluteURLString(list[index].user.avatar)
        }
    }
}

private struct APIEnvelope<Data: Decodable>: Decodable {
    let code: String
    let message: String?
    let data: Data?
}

private struct LoginBody: Encodable {
    let username: String
    let password: String
    let captchaId: String
    let captchaValue: String
    let deviceName: String
}

private struct LoginWith2FABody: Encodable {
    let username: String
    let password: String
    let twoFAToken: String
    let deviceName: String
}

private struct UpdateProfileBody<Value: Encodable>: Encodable {
    let key: String
    let value: Value
}

private struct UpdateProfilePasswordValue: Encodable {
    let password: String
    let currentPassword: String
    let twoFAToken: String
}

private struct CreateMusicbillBody: Encodable {
    let name: String
}

private struct UpdateMusicbillStringBody: Encodable {
    let id: String
    let key: String
    let value: String
}

private struct UpdateMusicbillBoolBody: Encodable {
    let id: String
    let key: String
    let value: Bool
    let captchaId: String?
    let captchaValue: String?
}

private struct MusicbillMusicBody: Encodable {
    let musicbillId: String
    let musicId: String
}

private struct AddMusicbillSharedUserBody: Encodable {
    let musicbillId: String
    let username: String
}

private struct PublicMusicbillCollectionBody: Encodable {
    let id: String
}

private struct SharedMusicbillInvitationBody: Encodable {
    let id: Int
}

private struct UpdateSessionBody: Encodable {
    let deviceName: String
}
