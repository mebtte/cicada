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
    static let usernameMaxLength = 16
    static let nicknameMaxLength = 32
    static let passwordMinLength = 6
    static let passwordMaxLength = 32
    static let deviceNameMaxLength = 64
    static let keywordMaxLength = 32
    static let musicPageSize = 50
    static let artistPageSize = 50
    static let publicMusicbillPageSize = 50
    static let publicMusicbillCollectionPageSize = 50
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
    @Published private(set) var updatingSharedUserMusicbillIDs: Set<MusicbillDetail.ID> = []
    @Published private(set) var isUpdatingProfile = false
    @Published private(set) var isChangingPassword = false
    @Published private(set) var sessions: [AuthSession] = []
    @Published private(set) var isLoadingSessions = false
    @Published private(set) var hasLoadedSessions = false
    @Published private(set) var updatingSessionIDs: Set<AuthSession.ID> = []
    @Published private(set) var userDetails: [UserDetail.ID: UserDetail] = [:]
    @Published private(set) var loadingUserIDs: Set<UserDetail.ID> = []
    @Published private(set) var musicDetails: [Music.ID: MusicDetail] = [:]
    @Published private(set) var loadingMusicDetailIDs: Set<Music.ID> = []
    @Published private(set) var musicbillActionCaptcha: CaptchaResponse?
    @Published private(set) var isLoadingMusicbillActionCaptcha = false
    @Published private(set) var searchMusicResults: [Music] = []
    @Published private(set) var searchMusicTotal = 0
    @Published private(set) var searchMusicPage = 1
    @Published private(set) var searchMusicKeyword = ""
    @Published private(set) var isSearchingMusic = false
    @Published private(set) var hasSearchedMusic = false
    @Published private(set) var searchArtistResults: [ArtistSearchItem] = []
    @Published private(set) var searchArtistTotal = 0
    @Published private(set) var searchArtistPage = 1
    @Published private(set) var searchArtistKeyword = ""
    @Published private(set) var isSearchingArtists = false
    @Published private(set) var hasSearchedArtists = false
    @Published private(set) var artistDetails: [ArtistDetail.ID: ArtistDetail] = [:]
    @Published private(set) var loadingArtistIDs: Set<ArtistDetail.ID> = []
    @Published private(set) var searchPublicMusicbillResults: [PublicMusicbillSearchItem] = []
    @Published private(set) var searchPublicMusicbillTotal = 0
    @Published private(set) var searchPublicMusicbillPage = 1
    @Published private(set) var searchPublicMusicbillKeyword = ""
    @Published private(set) var isSearchingPublicMusicbills = false
    @Published private(set) var hasSearchedPublicMusicbills = false
    @Published private(set) var publicMusicbillDetails: [PublicMusicbillDetail.ID: PublicMusicbillDetail] = [:]
    @Published private(set) var loadingPublicMusicbillIDs: Set<PublicMusicbillDetail.ID> = []
    @Published private(set) var collectingPublicMusicbillIDs: Set<PublicMusicbillDetail.ID> = []
    @Published private(set) var publicMusicbillCollections: [PublicMusicbillCollectionItem] = []
    @Published private(set) var publicMusicbillCollectionTotal = 0
    @Published private(set) var publicMusicbillCollectionPage = 1
    @Published private(set) var publicMusicbillCollectionKeyword = ""
    @Published private(set) var isLoadingPublicMusicbillCollections = false
    @Published private(set) var hasLoadedPublicMusicbillCollections = false
    @Published private(set) var sharedMusicbillInvitations: [SharedMusicbillInvitation] = []
    @Published private(set) var isLoadingSharedMusicbillInvitations = false
    @Published private(set) var hasLoadedSharedMusicbillInvitations = false
    @Published private(set) var acceptingSharedMusicbillInvitationIDs: Set<SharedMusicbillInvitation.ID> = []
    @Published private(set) var searchLyricResults: [LyricSearchResult] = []
    @Published private(set) var searchLyricTotal = 0
    @Published private(set) var searchLyricPage = 1
    @Published private(set) var searchLyricKeyword = ""
    @Published private(set) var isSearchingLyrics = false
    @Published private(set) var hasSearchedLyrics = false
    @Published private(set) var exploration: ExplorationData?
    @Published private(set) var isLoadingExploration = false
    @Published private(set) var hasLoadedExploration = false
    @Published private(set) var isRadioLoading = false
    @Published var errorMessage: String?
    @Published private(set) var authorizationExpiredMessage: String?

    let audioPlayer = AudioPlayerController()
    let offlineCacheManager = OfflineCacheManager()

    var searchMusicPageSize: Int {
        PlayerSearchConstants.musicPageSize
    }

    var searchArtistPageSize: Int {
        PlayerSearchConstants.artistPageSize
    }

    var searchPublicMusicbillPageSize: Int {
        PlayerSearchConstants.publicMusicbillPageSize
    }

    var publicMusicbillCollectionPageSize: Int {
        PlayerSearchConstants.publicMusicbillCollectionPageSize
    }

    var searchLyricPageSize: Int {
        PlayerSearchConstants.lyricPageSize
    }

    private var client: CicadaAPIClient?
    private var user: ServerUserRecord?
    private var authKey: String?
    private var radioFetchTask: Task<Void, Never>?

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
        artistDetails = [:]
        loadingArtistIDs = []
        publicMusicbillDetails = [:]
        loadingPublicMusicbillIDs = []
        collectingPublicMusicbillIDs = []
        resetPublicMusicbillCollections()
        resetSharedMusicbillInvitations()
        isSavingMusicbill = false
        updatingSharedUserMusicbillIDs = []
        isUpdatingProfile = false
        isChangingPassword = false
        resetSessions()
        userDetails = [:]
        loadingUserIDs = []
        musicDetails = [:]
        loadingMusicDetailIDs = []
        musicbillActionCaptcha = nil
        isLoadingMusicbillActionCaptcha = false
        resetSearches()
        resetExploration()
        stopRadio()
        authorizationExpiredMessage = nil
        audioPlayer.configure(client: client)
        configureOfflineCache(client: client)
    }

    private func configureOfflineCache(client: CicadaAPIClient) {
        offlineCacheManager.configure(client: client)
        offlineCacheManager.isMusicProtected = { [weak self] musicID in
            self?.audioPlayer.currentMusic?.id == musicID
        }
        audioPlayer.localAssetURLProvider = { [weak self] music in
            self?.offlineCacheManager.localPlaybackURL(for: music)
        }
        audioPlayer.onCacheEligible = { [weak self] music in
            guard AppSettingsSnapshot.offlineCacheEnabled() else { return }
            Task { await self?.offlineCacheManager.cache(music) }
        }
    }

    func saveOffline(_ music: Music) {
        Task { await offlineCacheManager.cache(music) }
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

    func inviteSharedUser(username rawUsername: String, to musicbillID: MusicbillDetail.ID) async -> Bool {
        guard let client,
              !updatingSharedUserMusicbillIDs.contains(musicbillID) else {
            return false
        }
        guard let username = normalizedUsername(rawUsername) else {
            errorMessage = "Username must be 1 to \(PlayerSearchConstants.usernameMaxLength) characters."
            return false
        }

        updatingSharedUserMusicbillIDs.insert(musicbillID)
        defer {
            updatingSharedUserMusicbillIDs.remove(musicbillID)
        }

        do {
            try await client.addMusicbillSharedUser(musicbillID: musicbillID, username: username)
            await loadMusicbill(id: musicbillID, force: true)
            return true
        } catch {
            handleRequestError(error)
            return false
        }
    }

    func removeSharedUser(userID: MusicbillUser.ID, from musicbillID: MusicbillDetail.ID) async -> Bool {
        guard let client,
              !updatingSharedUserMusicbillIDs.contains(musicbillID) else {
            return false
        }

        updatingSharedUserMusicbillIDs.insert(musicbillID)
        defer {
            updatingSharedUserMusicbillIDs.remove(musicbillID)
        }

        do {
            try await client.deleteMusicbillSharedUser(musicbillID: musicbillID, userID: userID)
            await loadMusicbill(id: musicbillID, force: true)
            return true
        } catch {
            handleRequestError(error)
            return false
        }
    }

    func leaveSharedMusicbill(id musicbillID: MusicbillDetail.ID) async -> Bool {
        guard let user else {
            return false
        }
        guard !isMusicbillOwner(musicbillDetails[musicbillID]) else {
            errorMessage = "The owner cannot leave this musicbill."
            return false
        }
        guard let client,
              !updatingSharedUserMusicbillIDs.contains(musicbillID) else {
            return false
        }

        updatingSharedUserMusicbillIDs.insert(musicbillID)
        defer {
            updatingSharedUserMusicbillIDs.remove(musicbillID)
        }

        do {
            try await client.deleteMusicbillSharedUser(musicbillID: musicbillID, userID: user.id)
            musicbillDetails[musicbillID] = nil
            await reloadMusicbillsAfterDeleting(id: musicbillID)
            return true
        } catch {
            handleRequestError(error)
            return false
        }
    }

    func refreshCurrentProfile() async -> UserProfile? {
        guard let client else { return nil }

        do {
            let profile = try await client.getProfile()
            applyProfile(profile)
            return profile
        } catch {
            handleRequestError(error)
            return nil
        }
    }

    func updateNickname(_ rawNickname: String) async -> UserProfile? {
        guard let client, !isUpdatingProfile else { return nil }
        guard let nickname = normalizedNickname(rawNickname) else {
            errorMessage = "Nickname must be 1 to \(PlayerSearchConstants.nicknameMaxLength) characters."
            return nil
        }
        if user?.nickname == nickname {
            return await refreshCurrentProfile()
        }

        isUpdatingProfile = true
        defer { isUpdatingProfile = false }

        do {
            try await client.updateProfileNickname(nickname)
            let profile = try await client.getProfile()
            applyProfile(profile)
            return profile
        } catch {
            handleRequestError(error)
            return nil
        }
    }

    func changePassword(
        credential rawCredential: String,
        newPassword rawNewPassword: String
    ) async -> Bool {
        guard let client, !isChangingPassword else { return false }
        let credential = rawCredential.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !credential.isEmpty else {
            errorMessage = "Enter your current password or 2FA token."
            return false
        }
        guard let newPassword = normalizedPassword(rawNewPassword) else {
            errorMessage = "Password must be \(PlayerSearchConstants.passwordMinLength)-\(PlayerSearchConstants.passwordMaxLength) characters."
            return false
        }

        isChangingPassword = true
        defer { isChangingPassword = false }

        do {
            try await client.updateProfilePassword(
                password: newPassword,
                credential: credential
            )
            return true
        } catch {
            handleRequestError(error)
            return false
        }
    }

    func loadSessions(force: Bool = false) async {
        guard let client, !isLoadingSessions else { return }
        if hasLoadedSessions, !force {
            return
        }

        isLoadingSessions = true
        hasLoadedSessions = true
        defer { isLoadingSessions = false }

        do {
            sessions = try await client.getSessions()
                .sorted { lhs, rhs in
                    if lhs.current != rhs.current {
                        return lhs.current
                    }
                    return lhs.lastSeenTimestamp > rhs.lastSeenTimestamp
                }
        } catch {
            handleRequestError(error)
        }
    }

    func renameSession(id: AuthSession.ID, deviceName rawDeviceName: String) async -> Bool {
        guard let client,
              !updatingSessionIDs.contains(id) else {
            return false
        }
        guard let deviceName = normalizedDeviceName(rawDeviceName) else {
            errorMessage = "Device name cannot be empty."
            return false
        }

        updatingSessionIDs.insert(id)
        defer {
            updatingSessionIDs.remove(id)
        }

        do {
            try await client.updateSession(id: id, deviceName: deviceName)
            await loadSessions(force: true)
            return true
        } catch {
            handleRequestError(error)
            return false
        }
    }

    func revokeSession(id: AuthSession.ID) async -> Bool {
        guard let client,
              !sessions.contains(where: { $0.id == id && $0.current }),
              !updatingSessionIDs.contains(id) else {
            return false
        }

        updatingSessionIDs.insert(id)
        defer {
            updatingSessionIDs.remove(id)
        }

        do {
            try await client.deleteSession(id: id)
            sessions.removeAll { $0.id == id }
            return true
        } catch {
            handleRequestError(error)
            return false
        }
    }

    func loadUser(id: UserDetail.ID, force: Bool = false) async {
        guard let client else { return }
        if !force, userDetails[id] != nil {
            return
        }
        guard !loadingUserIDs.contains(id) else { return }

        loadingUserIDs.insert(id)
        defer {
            loadingUserIDs.remove(id)
        }

        do {
            userDetails[id] = try await client.getUser(id: id)
        } catch {
            handleRequestError(error)
        }
    }

    func loadMusicDetail(id: Music.ID, force: Bool = false) async {
        guard let client else { return }
        if !force, musicDetails[id] != nil {
            return
        }
        guard !loadingMusicDetailIDs.contains(id) else { return }

        loadingMusicDetailIDs.insert(id)
        defer {
            loadingMusicDetailIDs.remove(id)
        }

        do {
            musicDetails[id] = try await client.getMusic(id: id)
        } catch {
            handleRequestError(error)
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

    func searchArtists(keyword rawKeyword: String, page rawPage: Int = 1) async {
        guard let client, !isSearchingArtists else { return }
        let keyword = normalizedSearchKeyword(rawKeyword)
        guard !keyword.isEmpty else {
            resetArtistSearch()
            return
        }

        let page = max(1, rawPage)
        isSearchingArtists = true
        hasSearchedArtists = true
        searchArtistKeyword = keyword
        searchArtistPage = page
        searchArtistResults = []
        searchArtistTotal = 0
        defer { isSearchingArtists = false }

        do {
            let result = try await client.searchArtist(
                keyword: keyword,
                page: page,
                pageSize: PlayerSearchConstants.artistPageSize
            )
            guard searchArtistKeyword == keyword, searchArtistPage == page else {
                return
            }
            searchArtistResults = result.artistList
            searchArtistTotal = result.total
        } catch {
            handleRequestError(error)
        }
    }

    func resetArtistSearch() {
        searchArtistResults = []
        searchArtistTotal = 0
        searchArtistPage = 1
        searchArtistKeyword = ""
        isSearchingArtists = false
        hasSearchedArtists = false
    }

    func loadArtist(id: ArtistDetail.ID, force: Bool = false) async {
        guard let client else { return }
        if !force, artistDetails[id] != nil {
            return
        }
        guard !loadingArtistIDs.contains(id) else { return }

        loadingArtistIDs.insert(id)
        defer {
            loadingArtistIDs.remove(id)
        }

        do {
            artistDetails[id] = try await client.getArtist(id: id)
        } catch {
            handleRequestError(error)
        }
    }

    func searchPublicMusicbills(keyword rawKeyword: String, page rawPage: Int = 1) async {
        guard let client, !isSearchingPublicMusicbills else { return }
        let keyword = normalizedSearchKeyword(rawKeyword)
        guard !keyword.isEmpty else {
            resetPublicMusicbillSearch()
            return
        }

        let page = max(1, rawPage)
        isSearchingPublicMusicbills = true
        hasSearchedPublicMusicbills = true
        searchPublicMusicbillKeyword = keyword
        searchPublicMusicbillPage = page
        searchPublicMusicbillResults = []
        searchPublicMusicbillTotal = 0
        defer { isSearchingPublicMusicbills = false }

        do {
            let result = try await client.searchPublicMusicbill(
                keyword: keyword,
                page: page,
                pageSize: PlayerSearchConstants.publicMusicbillPageSize
            )
            guard searchPublicMusicbillKeyword == keyword,
                  searchPublicMusicbillPage == page else {
                return
            }
            searchPublicMusicbillResults = result.musicbillList
            searchPublicMusicbillTotal = result.total
        } catch {
            handleRequestError(error)
        }
    }

    func resetPublicMusicbillSearch() {
        searchPublicMusicbillResults = []
        searchPublicMusicbillTotal = 0
        searchPublicMusicbillPage = 1
        searchPublicMusicbillKeyword = ""
        isSearchingPublicMusicbills = false
        hasSearchedPublicMusicbills = false
    }

    func loadPublicMusicbill(id: PublicMusicbillDetail.ID, force: Bool = false) async {
        guard let client else { return }
        if !force, publicMusicbillDetails[id] != nil {
            return
        }
        guard !loadingPublicMusicbillIDs.contains(id) else { return }

        loadingPublicMusicbillIDs.insert(id)
        defer {
            loadingPublicMusicbillIDs.remove(id)
        }

        do {
            publicMusicbillDetails[id] = try await client.getPublicMusicbill(id: id)
        } catch {
            handleRequestError(error)
        }
    }

    func setPublicMusicbillCollected(id: PublicMusicbillDetail.ID, collected: Bool) async -> Bool {
        guard let client, !collectingPublicMusicbillIDs.contains(id) else { return false }

        collectingPublicMusicbillIDs.insert(id)
        let previousDetail = publicMusicbillDetails[id]
        if var detail = publicMusicbillDetails[id] {
            detail.collected = collected
            publicMusicbillDetails[id] = detail
        }
        defer {
            collectingPublicMusicbillIDs.remove(id)
        }

        do {
            if collected {
                try await client.collectPublicMusicbill(id: id)
            } else {
                try await client.uncollectPublicMusicbill(id: id)
            }
            await reloadMusicbillsKeepingSelection()
            await reloadPublicMusicbillCollectionsIfNeeded()
            return true
        } catch {
            if let previousDetail {
                publicMusicbillDetails[id] = previousDetail
            }
            handleRequestError(error)
            return false
        }
    }

    func loadPublicMusicbillCollections(
        keyword rawKeyword: String = "",
        page rawPage: Int = 1,
        force: Bool = false
    ) async {
        guard let client, !isLoadingPublicMusicbillCollections else { return }

        let keyword = normalizedSearchKeyword(rawKeyword)
        let page = max(1, rawPage)
        if !force,
           hasLoadedPublicMusicbillCollections,
           publicMusicbillCollectionKeyword == keyword,
           publicMusicbillCollectionPage == page {
            return
        }

        isLoadingPublicMusicbillCollections = true
        hasLoadedPublicMusicbillCollections = true
        publicMusicbillCollectionKeyword = keyword
        publicMusicbillCollectionPage = page
        publicMusicbillCollections = []
        publicMusicbillCollectionTotal = 0
        defer { isLoadingPublicMusicbillCollections = false }

        do {
            let result = try await client.getPublicMusicbillCollectionList(
                keyword: keyword,
                page: page,
                pageSize: PlayerSearchConstants.publicMusicbillCollectionPageSize
            )
            guard publicMusicbillCollectionKeyword == keyword,
                  publicMusicbillCollectionPage == page else {
                return
            }
            publicMusicbillCollections = result.collectionList
            publicMusicbillCollectionTotal = result.total
        } catch {
            handleRequestError(error)
        }
    }

    func resetPublicMusicbillCollections() {
        publicMusicbillCollections = []
        publicMusicbillCollectionTotal = 0
        publicMusicbillCollectionPage = 1
        publicMusicbillCollectionKeyword = ""
        isLoadingPublicMusicbillCollections = false
        hasLoadedPublicMusicbillCollections = false
    }

    func loadSharedMusicbillInvitations(force: Bool = false) async {
        guard let client, !isLoadingSharedMusicbillInvitations else { return }
        if hasLoadedSharedMusicbillInvitations, !force {
            return
        }

        isLoadingSharedMusicbillInvitations = true
        hasLoadedSharedMusicbillInvitations = true
        defer { isLoadingSharedMusicbillInvitations = false }

        do {
            sharedMusicbillInvitations = try await client.getSharedMusicbillInvitationList()
        } catch {
            handleRequestError(error)
        }
    }

    func acceptSharedMusicbillInvitation(_ invitation: SharedMusicbillInvitation) async -> Bool {
        guard let client,
              !acceptingSharedMusicbillInvitationIDs.contains(invitation.id) else {
            return false
        }

        acceptingSharedMusicbillInvitationIDs.insert(invitation.id)
        defer {
            acceptingSharedMusicbillInvitationIDs.remove(invitation.id)
        }

        do {
            try await client.acceptSharedMusicbillInvitation(id: invitation.id)
            sharedMusicbillInvitations.removeAll { $0.id == invitation.id }
            await reloadMusicbills(selecting: invitation.musicbillID)
            await loadMusicbill(id: invitation.musicbillID, force: true)
            return true
        } catch {
            handleRequestError(error)
            return false
        }
    }

    func resetSharedMusicbillInvitations() {
        sharedMusicbillInvitations = []
        isLoadingSharedMusicbillInvitations = false
        hasLoadedSharedMusicbillInvitations = false
        acceptingSharedMusicbillInvitationIDs = []
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

    func loadExploration(force: Bool = false) async {
        guard let client, !isLoadingExploration else { return }
        if hasLoadedExploration, !force {
            return
        }

        isLoadingExploration = true
        hasLoadedExploration = true
        defer { isLoadingExploration = false }

        do {
            exploration = try await client.getExploration()
        } catch {
            handleRequestError(error)
        }
    }

    func resetExploration() {
        exploration = nil
        isLoadingExploration = false
        hasLoadedExploration = false
    }

    /// Fetch the full, playable version of a music item (exploration items carry
    /// no asset) and start playing it as a single-item queue.
    func playMusic(id: Music.ID) async {
        guard let client else { return }

        do {
            let detail = try await client.getMusic(id: id)
            let music = Music(detail: detail)
            audioPlayer.play(music: music, in: [music])
        } catch {
            handleRequestError(error)
        }
    }

    func startRadio() async {
        guard let client else { return }
        guard !isRadioLoading else { return }

        radioFetchTask?.cancel()
        radioFetchTask = nil
        audioPlayer.onRadioAdvance = { [weak self] in
            self?.scheduleRadioPrefetch()
        }
        isRadioLoading = true
        defer { isRadioLoading = false }

        do {
            let music = try await client.getRandomMusic(excludeID: nil)
            audioPlayer.startRadio(initial: music)
            await prefetchRadio()
        } catch {
            audioPlayer.onRadioAdvance = nil
            handleRequestError(error)
        }
    }

    func skipRadio() {
        guard audioPlayer.isRadioMode else { return }
        audioPlayer.next()
    }

    func stopRadio() {
        radioFetchTask?.cancel()
        radioFetchTask = nil
        isRadioLoading = false
        audioPlayer.onRadioAdvance = nil
        if audioPlayer.isRadioMode {
            audioPlayer.stop()
        }
    }

    private func scheduleRadioPrefetch() {
        guard radioFetchTask == nil else { return }
        radioFetchTask = Task { [weak self] in
            await self?.prefetchRadio()
            self?.radioFetchTask = nil
        }
    }

    private func prefetchRadio() async {
        guard let client else { return }
        // Keep at least one upcoming track queued so playback never stalls.
        while audioPlayer.isRadioMode,
              audioPlayer.queue.count - 1 - audioPlayer.currentQueueIndex < 1 {
            let excludeID = audioPlayer.queue.last?.id
            do {
                let music = try await client.getRandomMusic(excludeID: excludeID)
                guard audioPlayer.isRadioMode else { return }
                audioPlayer.appendMusic(music)
            } catch {
                return
            }
        }
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

    func isMusicbillOwner(_ detail: MusicbillDetail?) -> Bool {
        guard let detail else { return false }
        return detail.owner.id == user?.id
    }

    func isCurrentUser(id: MusicbillUser.ID) -> Bool {
        user?.id == id
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

    private func reloadMusicbillsKeepingSelection() async {
        guard let client else { return }

        do {
            let list = try await client.getMusicbillList()
            musicbills = sortMusicbills(list)
            if let selectedMusicbillID,
               musicbills.contains(where: { $0.id == selectedMusicbillID }) {
                return
            }
            selectedMusicbillID = musicbills.first?.id
        } catch {
            handleRequestError(error)
        }
    }

    private func reloadPublicMusicbillCollectionsIfNeeded() async {
        guard hasLoadedPublicMusicbillCollections else { return }

        await loadPublicMusicbillCollections(
            keyword: publicMusicbillCollectionKeyword,
            page: publicMusicbillCollectionPage,
            force: true
        )
    }

    private func resetSessions() {
        sessions = []
        isLoadingSessions = false
        hasLoadedSessions = false
        updatingSessionIDs = []
    }

    private func applyProfile(_ profile: UserProfile) {
        guard var user else { return }
        guard user.id == profile.id else { return }
        user.username = profile.username
        user.avatar = profile.avatar
        user.nickname = profile.nickname
        user.joinTimestamp = profile.joinTimestamp
        user.admin = profile.admin
        user.musicbillOrders = profile.musicbillOrders
        user.twoFAEnabled = profile.twoFAEnabled
        self.user = user
    }

    private func resetSearches() {
        resetMusicSearch()
        resetArtistSearch()
        resetPublicMusicbillSearch()
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

    private func normalizedUsername(_ rawUsername: String) -> String? {
        let username = rawUsername.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !username.isEmpty,
              username.count <= PlayerSearchConstants.usernameMaxLength else {
            return nil
        }
        return username
    }

    private func normalizedNickname(_ rawNickname: String) -> String? {
        let collapsed = rawNickname
            .components(separatedBy: .whitespacesAndNewlines)
            .filter { !$0.isEmpty }
            .joined(separator: " ")
        guard !collapsed.isEmpty,
              collapsed.count <= PlayerSearchConstants.nicknameMaxLength else {
            return nil
        }
        return collapsed
    }

    private func normalizedPassword(_ rawPassword: String) -> String? {
        guard rawPassword.count >= PlayerSearchConstants.passwordMinLength,
              rawPassword.count <= PlayerSearchConstants.passwordMaxLength else {
            return nil
        }
        return rawPassword
    }

    private func normalizedDeviceName(_ rawDeviceName: String) -> String? {
        let deviceName = rawDeviceName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !deviceName.isEmpty else { return nil }
        return String(deviceName.prefix(PlayerSearchConstants.deviceNameMaxLength))
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
