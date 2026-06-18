import Foundation

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

    func getMusicbillList() async throws -> [MusicbillSummary] {
        var musicbills: [MusicbillSummary] = try await request(path: "/api/common/musicbill_list")
        for index in musicbills.indices {
            var musicbill = musicbills[index]
            musicbill.cover = absoluteURLString(musicbill.cover)
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

    func musicPlaybackURL(for music: Music) -> URL? {
        guard var components = URLComponents(string: music.asset) else {
            return nil
        }
        var queryItems = components.queryItems ?? []
        queryItems.removeAll(where: { $0.name == "quality" })
        queryItems.append(URLQueryItem(name: "quality", value: "smooth"))
        components.queryItems = queryItems
        return components.url
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
        queryItems.append(URLQueryItem(name: "version", value: appVersion))
        queryItems.append(URLQueryItem(name: "language", value: preferredLanguage))
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

    private var appVersion: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String
            ?? "apple"
    }

    private var preferredLanguage: String {
        Locale.preferredLanguages.first ?? Locale.current.identifier
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
