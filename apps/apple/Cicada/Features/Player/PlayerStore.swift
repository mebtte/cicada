import Foundation

enum PlayerLyricLoadResult: Equatable {
    case instrumental
    case empty
    case loaded([LyricItem])
    case failed(String)
}

struct LyricSearchSnippetLine: Hashable, Identifiable {
    let id: String
    let text: String
    let isMatch: Bool
}

struct LyricSearchResult: Hashable, Identifiable {
    let music: Music
    let snippetLines: [LyricSearchSnippetLine]

    var id: Music.ID {
        music.id
    }
}

private enum MusicbillMusicBusinessCode {
    static let alreadyExists = "music_already_existed_in_musicbill"
    static let notExists = "music_not_existed_in_musicbill"
}

private enum PlayerSearchConstants {
    static let keywordMaxLength = 32
    static let musicPageSize = 50
    static let lyricPageSize = 20
}

@MainActor
final class PlayerStore: ObservableObject {
    @Published private(set) var musicbills: [MusicbillSummary] = []
    @Published var selectedMusicbillID: MusicbillSummary.ID?
    @Published private(set) var musicbillDetails: [MusicbillDetail.ID: MusicbillDetail] = [:]
    @Published private(set) var loadingMusicbillIDs: Set<MusicbillDetail.ID> = []
    @Published private(set) var isLoadingMusicbillList = false
    @Published private(set) var isSavingMusicbill = false
    @Published private(set) var musicbillActionCaptcha: CaptchaResponse?
    @Published private(set) var isLoadingMusicbillActionCaptcha = false
    @Published private(set) var searchMusicResults: [Music] = []
    @Published private(set) var searchMusicTotal = 0
    @Published private(set) var searchMusicPage = 1
    @Published private(set) var searchMusicKeyword = ""
    @Published private(set) var isSearchingMusic = false
    @Published private(set) var hasSearchedMusic = false
    @Published private(set) var searchLyricResults: [LyricSearchResult] = []
    @Published private(set) var searchLyricTotal = 0
    @Published private(set) var searchLyricPage = 1
    @Published private(set) var searchLyricKeyword = ""
    @Published private(set) var isSearchingLyrics = false
    @Published private(set) var hasSearchedLyrics = false
    @Published var errorMessage: String?
    @Published private(set) var authorizationExpiredMessage: String?

    let audioPlayer = AudioPlayerController()

    var searchMusicPageSize: Int {
        PlayerSearchConstants.musicPageSize
    }

    var searchLyricPageSize: Int {
        PlayerSearchConstants.lyricPageSize
    }

    private var client: CicadaAPIClient?
    private var user: ServerUserRecord?
    private var authKey: String?

    func configure(server: ServerRecord, user: ServerUserRecord) {
        let nextAuthKey = "\(server.origin)|\(user.id)|\(user.token)"
        guard authKey != nextAuthKey else { return }

        let client = CicadaAPIClient(server: server, user: user)
        self.client = client
        self.user = user
        authKey = nextAuthKey
        musicbills = []
        selectedMusicbillID = nil
        musicbillDetails = [:]
        loadingMusicbillIDs = []
        isSavingMusicbill = false
        musicbillActionCaptcha = nil
        isLoadingMusicbillActionCaptcha = false
        resetSearches()
        authorizationExpiredMessage = nil
        audioPlayer.configure(client: client)
    }

    func loadMusicbillList() async {
        guard let client, !isLoadingMusicbillList else { return }
        isLoadingMusicbillList = true
        defer { isLoadingMusicbillList = false }

        do {
            let list = try await client.getMusicbillList()
            musicbills = sortMusicbills(list)
            if selectedMusicbillID == nil || !musicbills.contains(where: { $0.id == selectedMusicbillID }) {
                selectedMusicbillID = musicbills.first?.id
            }
        } catch {
            handleRequestError(error)
        }
    }

    func loadMusicbill(id: MusicbillDetail.ID, force: Bool = false) async {
        guard let client else { return }
        if !force, musicbillDetails[id] != nil {
            return
        }
        guard !loadingMusicbillIDs.contains(id) else { return }

        loadingMusicbillIDs.insert(id)
        defer {
            loadingMusicbillIDs.remove(id)
        }

        do {
            let detail = try await client.getMusicbill(id: id)
            musicbillDetails[id] = detail
        } catch {
            handleRequestError(error)
        }
    }

    func play(music: Music, in musicbill: MusicbillDetail) {
        audioPlayer.play(music: music, in: musicbill.musicList)
    }

    func play(music: Music, in playlist: [Music]) {
        audioPlayer.play(music: music, in: playlist)
    }

    func createMusicbill(name: String) async -> Bool {
        guard let client, !isSavingMusicbill else { return false }
        guard let name = normalizedMusicbillName(name) else {
            errorMessage = "Musicbill name must be 1 to 64 characters."
            return false
        }

        isSavingMusicbill = true
        defer { isSavingMusicbill = false }

        do {
            let id = try await client.createMusicbill(name: name)
            await reloadMusicbills(selecting: id)
            await loadMusicbill(id: id, force: true)
            return true
        } catch {
            handleRequestError(error)
            return false
        }
    }

    func renameMusicbill(id: MusicbillDetail.ID, name: String) async -> Bool {
        guard let client, !isSavingMusicbill else { return false }
        guard let name = normalizedMusicbillName(name) else {
            errorMessage = "Musicbill name must be 1 to 64 characters."
            return false
        }
        if summary(for: id)?.name == name || musicbillDetails[id]?.name == name {
            return true
        }

        isSavingMusicbill = true
        defer { isSavingMusicbill = false }

        do {
            try await client.updateMusicbillName(id: id, name: name)
            await reloadMusicbills(selecting: id)
            await loadMusicbill(id: id, force: true)
            return true
        } catch {
            handleRequestError(error)
            return false
        }
    }

    func publishMusicbill(id: MusicbillDetail.ID) async -> Bool {
        guard let client, !isSavingMusicbill else { return false }
        if summary(for: id)?.isPublic == true || musicbillDetails[id]?.isPublic == true {
            return true
        }

        isSavingMusicbill = true
        defer { isSavingMusicbill = false }

        do {
            try await client.updateMusicbillPublic(id: id, isPublic: true)
            await reloadMusicbills(selecting: id)
            await loadMusicbill(id: id, force: true)
            return true
        } catch {
            handleRequestError(error)
            return false
        }
    }

    func unpublishMusicbill(id: MusicbillDetail.ID, captchaValue: String) async -> Bool {
        guard let client, !isSavingMusicbill else { return false }
        if summary(for: id)?.isPublic == false || musicbillDetails[id]?.isPublic == false {
            return true
        }
        guard let captcha = musicbillActionCaptcha,
              let captchaValue = normalizedCaptchaValue(captchaValue) else {
            errorMessage = "Enter the captcha before continuing."
            return false
        }

        isSavingMusicbill = true
        defer { isSavingMusicbill = false }

        do {
            try await client.updateMusicbillPublic(
                id: id,
                isPublic: false,
                captchaID: captcha.id,
                captchaValue: captchaValue
            )
            musicbillActionCaptcha = nil
            await reloadMusicbills(selecting: id)
            await loadMusicbill(id: id, force: true)
            return true
        } catch {
            handleRequestError(error)
            return false
        }
    }

    func deleteMusicbill(id: MusicbillDetail.ID, captchaValue: String) async -> Bool {
        guard let client, !isSavingMusicbill else { return false }
        guard let captcha = musicbillActionCaptcha,
              let captchaValue = normalizedCaptchaValue(captchaValue) else {
            errorMessage = "Enter the captcha before continuing."
            return false
        }

        isSavingMusicbill = true
        defer { isSavingMusicbill = false }

        do {
            try await client.deleteMusicbill(
                id: id,
                captchaID: captcha.id,
                captchaValue: captchaValue
            )
            musicbillActionCaptcha = nil
            musicbillDetails[id] = nil
            await reloadMusicbillsAfterDeleting(id: id)
            return true
        } catch {
            handleRequestError(error)
            return false
        }
    }

    func addMusic(_ music: Music, to musicbillID: MusicbillDetail.ID) async -> Bool {
        guard let client, !isSavingMusicbill else { return false }
        if containsMusic(music.id, in: musicbillID) == true {
            return true
        }

        isSavingMusicbill = true
        defer { isSavingMusicbill = false }

        do {
            try await client.addMusicToMusicbill(musicbillID: musicbillID, musicID: music.id)
            await reloadMusicbillAfterChangingSongs(id: musicbillID)
            return true
        } catch {
            if businessCode(for: error) == MusicbillMusicBusinessCode.alreadyExists {
                await reloadMusicbillAfterChangingSongs(id: musicbillID)
                return true
            }
            handleRequestError(error)
            return false
        }
    }

    func removeMusic(_ music: Music, from musicbillID: MusicbillDetail.ID) async -> Bool {
        guard let client, !isSavingMusicbill else { return false }
        if containsMusic(music.id, in: musicbillID) == false {
            return true
        }

        isSavingMusicbill = true
        defer { isSavingMusicbill = false }

        do {
            try await client.removeMusicFromMusicbill(musicbillID: musicbillID, musicID: music.id)
            await reloadMusicbillAfterChangingSongs(id: musicbillID)
            return true
        } catch {
            if businessCode(for: error) == MusicbillMusicBusinessCode.notExists {
                await reloadMusicbillAfterChangingSongs(id: musicbillID)
                return true
            }
            handleRequestError(error)
            return false
        }
    }

    func loadMusicbillActionCaptcha(force: Bool = false) async {
        guard let client, !isLoadingMusicbillActionCaptcha else { return }
        if musicbillActionCaptcha != nil, !force {
            return
        }

        isLoadingMusicbillActionCaptcha = true
        defer { isLoadingMusicbillActionCaptcha = false }

        do {
            musicbillActionCaptcha = try await client.getCaptcha()
        } catch {
            handleRequestError(error)
        }
    }

    func clearMusicbillActionCaptcha() {
        musicbillActionCaptcha = nil
    }

    func loadLyrics(for music: Music) async -> PlayerLyricLoadResult {
        guard music.type != 2 else {
            return .instrumental
        }
        guard let client else {
            return .failed("Sign in before loading lyrics.")
        }

        do {
            let lyrics = try await client.getLyricList(musicID: music.id)
            return lyrics.isEmpty ? .empty : .loaded(lyrics)
        } catch {
            return .failed(handleInlineRequestError(error))
        }
    }

    func searchMusic(keyword rawKeyword: String, page rawPage: Int = 1) async {
        guard let client, !isSearchingMusic else { return }
        let keyword = normalizedSearchKeyword(rawKeyword)
        guard !keyword.isEmpty else {
            resetMusicSearch()
            return
        }

        let page = max(1, rawPage)
        isSearchingMusic = true
        hasSearchedMusic = true
        searchMusicKeyword = keyword
        searchMusicPage = page
        searchMusicResults = []
        searchMusicTotal = 0
        defer { isSearchingMusic = false }

        do {
            let result = try await client.searchMusic(
                keyword: keyword,
                page: page,
                pageSize: PlayerSearchConstants.musicPageSize
            )
            guard searchMusicKeyword == keyword, searchMusicPage == page else {
                return
            }
            searchMusicResults = result.musicList
            searchMusicTotal = result.total
        } catch {
            handleRequestError(error)
        }
    }

    func resetMusicSearch() {
        searchMusicResults = []
        searchMusicTotal = 0
        searchMusicPage = 1
        searchMusicKeyword = ""
        isSearchingMusic = false
        hasSearchedMusic = false
    }

    func searchLyrics(keyword rawKeyword: String, page rawPage: Int = 1) async {
        guard let client, !isSearchingLyrics else { return }
        let keyword = normalizedSearchKeyword(rawKeyword)
        guard !keyword.isEmpty else {
            resetLyricSearch()
            return
        }

        let page = max(1, rawPage)
        isSearchingLyrics = true
        hasSearchedLyrics = true
        searchLyricKeyword = keyword
        searchLyricPage = page
        searchLyricResults = []
        searchLyricTotal = 0
        defer { isSearchingLyrics = false }

        do {
            let result = try await client.searchMusicByLyric(
                keyword: keyword,
                page: page,
                pageSize: PlayerSearchConstants.lyricPageSize
            )
            guard searchLyricKeyword == keyword, searchLyricPage == page else {
                return
            }
            searchLyricResults = result.musicList.map { item in
                lyricSearchResult(from: item, keyword: keyword)
            }
            searchLyricTotal = result.total
        } catch {
            handleRequestError(error)
        }
    }

    func resetLyricSearch() {
        searchLyricResults = []
        searchLyricTotal = 0
        searchLyricPage = 1
        searchLyricKeyword = ""
        isSearchingLyrics = false
        hasSearchedLyrics = false
    }

    func summary(for id: MusicbillSummary.ID) -> MusicbillSummary? {
        musicbills.first(where: { $0.id == id })
    }

    func containsMusic(_ musicID: Music.ID, in musicbillID: MusicbillDetail.ID) -> Bool? {
        guard let detail = musicbillDetails[musicbillID] else {
            return nil
        }
        return detail.musicList.contains { $0.id == musicID }
    }

    func canDeleteMusicbill(_ detail: MusicbillDetail) -> Bool {
        detail.owner.id == user?.id
    }

    func deleteCurrentSession() async {
        guard let client else { return }
        try? await client.deleteCurrentSession()
    }

    func dismissError() {
        errorMessage = nil
        audioPlayer.errorMessage = nil
    }

    func acknowledgeAuthorizationExpired() {
        authorizationExpiredMessage = nil
    }

    private func sortMusicbills(_ list: [MusicbillSummary]) -> [MusicbillSummary] {
        guard let orders = user?.musicbillOrders, !orders.isEmpty else {
            return list.sorted { $0.createTimestamp > $1.createTimestamp }
        }

        return list.sorted { lhs, rhs in
            let leftOrder = orders.firstIndex(of: lhs.id) ?? Int.max
            let rightOrder = orders.firstIndex(of: rhs.id) ?? Int.max
            if leftOrder != rightOrder {
                return leftOrder < rightOrder
            }
            return lhs.createTimestamp > rhs.createTimestamp
        }
    }

    private func reloadMusicbills(selecting id: MusicbillSummary.ID) async {
        guard let client else { return }

        do {
            let list = try await client.getMusicbillList()
            musicbills = sortMusicbills(list)
            selectedMusicbillID = id
        } catch {
            handleRequestError(error)
        }
    }

    private func reloadMusicbillsAfterDeleting(id: MusicbillSummary.ID) async {
        guard let client else { return }

        do {
            let list = try await client.getMusicbillList()
            musicbills = sortMusicbills(list)
            if selectedMusicbillID == id || selectedMusicbillID == nil {
                selectedMusicbillID = musicbills.first?.id
            } else if let selectedMusicbillID,
                      !musicbills.contains(where: { $0.id == selectedMusicbillID }) {
                self.selectedMusicbillID = musicbills.first?.id
            }
        } catch {
            handleRequestError(error)
        }
    }

    private func reloadMusicbillAfterChangingSongs(id: MusicbillSummary.ID) async {
        await reloadMusicbills(selecting: selectedMusicbillID ?? id)
        await loadMusicbill(id: id, force: true)
    }

    private func resetSearches() {
        resetMusicSearch()
        resetLyricSearch()
    }

    private func normalizedMusicbillName(_ rawName: String) -> String? {
        let name = rawName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty, name.count <= 64 else {
            return nil
        }
        return name
    }

    private func normalizedCaptchaValue(_ rawValue: String) -> String? {
        let value = rawValue.trimmingCharacters(in: .whitespacesAndNewlines)
        return value.isEmpty ? nil : value
    }

    private func normalizedSearchKeyword(_ rawKeyword: String) -> String {
        let collapsedWhitespace = rawKeyword
            .components(separatedBy: .whitespacesAndNewlines)
            .filter { !$0.isEmpty }
            .joined(separator: " ")
        return String(collapsedWhitespace.prefix(PlayerSearchConstants.keywordMaxLength))
    }

    private func lyricSearchResult(from item: MusicWithLyrics, keyword: String) -> LyricSearchResult {
        for lyric in item.lyrics {
            let lines = lyricTextLines(from: lyric.lrc)
            guard let matchIndex = lines.firstIndex(where: { line in
                line.range(of: keyword, options: [.caseInsensitive, .diacriticInsensitive]) != nil
            }) else {
                continue
            }

            let lowerBound = max(0, matchIndex - 2)
            let upperBound = min(lines.count - 1, matchIndex + 2)
            let snippetLines = (lowerBound...upperBound).map { index in
                LyricSearchSnippetLine(
                    id: "\(item.id)-\(lyric.id)-\(index)",
                    text: lines[index],
                    isMatch: index == matchIndex
                )
            }
            return LyricSearchResult(music: item.music, snippetLines: snippetLines)
        }

        return LyricSearchResult(music: item.music, snippetLines: [])
    }

    private func lyricTextLines(from lrc: String) -> [String] {
        lrc.components(separatedBy: .newlines).compactMap(strippedLyricLine)
    }

    private func strippedLyricLine(_ rawLine: String) -> String? {
        let trimmedLine = rawLine.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedLine.isEmpty else { return nil }

        let pattern = #"\[[^\]]+\]"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else {
            return trimmedLine
        }
        let range = NSRange(location: 0, length: (trimmedLine as NSString).length)
        let text = regex
            .stringByReplacingMatches(in: trimmedLine, range: range, withTemplate: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return text.isEmpty ? nil : text
    }

    private func handleRequestError(_ error: Error) {
        if CicadaAPIError.isNotAuthorized(error) {
            authorizationExpiredMessage = "Your session has expired. Sign in again."
            return
        }
        errorMessage = presentableMessage(for: error)
    }

    private func handleInlineRequestError(_ error: Error) -> String {
        if CicadaAPIError.isNotAuthorized(error) {
            let message = "Your session has expired. Sign in again."
            authorizationExpiredMessage = message
            return message
        }
        return presentableMessage(for: error)
    }

    private func presentableMessage(for error: Error) -> String {
        if let localizedError = error as? LocalizedError,
           let description = localizedError.errorDescription,
           !description.isEmpty {
            return description
        }
        return error.localizedDescription
    }

    private func businessCode(for error: Error) -> String? {
        (error as? CicadaAPIError)?.businessCode
    }
}
