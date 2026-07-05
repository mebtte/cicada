import Foundation
import SwiftUI

enum PlayerSearchTab: String, CaseIterable, Identifiable {
    case music = "Music"
    case artists = "Artists"
    case publicMusicbills = "Public"
    case lyrics = "Lyrics"

    var id: String {
        rawValue
    }

    var prompt: String {
        switch self {
        case .music, .artists, .lyrics:
            return rawValue
        case .publicMusicbills:
            return "Public Musicbills"
        }
    }
}

struct SearchMusicView: View {
    @ObservedObject var playerStore: PlayerStore
    let showsDoneButton: Bool
    let embedsInNavigationStack: Bool

    @Environment(\.dismiss) private var dismiss
    @State private var selectedTab = PlayerSearchTab.music
    @State private var searchText = ""
    @State private var musicForMusicbillSelection: Music?
    @State private var artistForDetail: ArtistSearchItem?
    @State private var publicMusicbillForDetail: PublicMusicbillSearchItem?

    init(
        playerStore: PlayerStore,
        showsDoneButton: Bool = true,
        embedsInNavigationStack: Bool = true
    ) {
        self.playerStore = playerStore
        self.showsDoneButton = showsDoneButton
        self.embedsInNavigationStack = embedsInNavigationStack
    }

    var body: some View {
        platformSearchPage
        .onChange(of: selectedTab) { _, _ in
            syncSearchTextWithSelectedTab()
        }
        .task {
            syncSearchTextWithSelectedTab()
        }
        .sheet(item: $musicForMusicbillSelection) { music in
            AddToMusicbillSheet(
                music: music,
                playerStore: playerStore
            )
        }
        .sheet(item: $artistForDetail) { artist in
            ArtistDetailView(
                artist: artist,
                playerStore: playerStore
            )
        }
        .sheet(item: $publicMusicbillForDetail) { musicbill in
            PublicMusicbillDetailView(
                musicbill: musicbill,
                playerStore: playerStore
            )
        }
    }

    @ViewBuilder
    private var platformSearchPage: some View {
        #if os(macOS)
        baseSearchPage
        #else
        baseSearchPage
            .searchable(text: $searchText, prompt: selectedTab.prompt)
            .onSubmit(of: .search) {
                Task {
                    await search(page: 1)
                }
            }
        #endif
    }

    @ViewBuilder
    private var baseSearchPage: some View {
        if embedsInNavigationStack {
            NavigationStack {
                pageContent
            }
        } else {
            pageContent
        }
    }

    private var pageContent: some View {
        VStack(spacing: 0) {
            #if os(macOS)
            searchHeader
            #endif

            if isSearchMode {
                Picker("Search Type", selection: $selectedTab) {
                    ForEach(PlayerSearchTab.allCases) { tab in
                        Text(tab.rawValue).tag(tab)
                    }
                }
                .pickerStyle(.segmented)
                .padding()
            }

            content
        }
        #if os(macOS)
        .navigationTitle("")
        #else
        .navigationTitle("Explore")
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .toolbar {
            if showsDoneButton {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }

            #if !os(macOS)
            ToolbarItem(placement: .primaryAction) {
                if isSearchMode {
                    Button {
                        Task {
                            await search(page: 1)
                        }
                    } label: {
                        Image(systemName: "magnifyingglass")
                    }
                    .disabled(trimmedSearchText.isEmpty || isSearching)
                    .help("Search")
                } else {
                    #if !os(macOS)
                    Button {
                        Task {
                            await playerStore.loadExploration(force: true)
                        }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(playerStore.isLoadingExploration)
                    .help("Refresh")
                    #endif
                }
            }
            #endif
        }
    }

    #if os(macOS)
    private var searchHeader: some View {
        HStack(spacing: 16) {
            Text("Explore")
                .font(.largeTitle.weight(.semibold))

            Spacer(minLength: 24)

            macSearchField
                .frame(width: 320)
        }
        .padding(.horizontal, 24)
        .padding(.top, 16)
        .padding(.bottom, 12)
    }

    private var macSearchField: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(.secondary)

            TextField(selectedTab.prompt, text: $searchText)
                .textFieldStyle(.plain)
                .onSubmit {
                    Task {
                        await search(page: 1)
                    }
                }

            if !searchText.isEmpty {
                Button {
                    searchText = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
                .help("Clear Search")
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .background(Color.cicadaSecondaryBackground)
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .stroke(Color.primary.opacity(0.08), lineWidth: 1)
        }
    }
    #endif

    @ViewBuilder
    private var content: some View {
        if !isSearchMode {
            ExplorationContentView(playerStore: playerStore)
        } else {
            switch selectedTab {
            case .music:
                musicContent
            case .artists:
                artistContent
            case .publicMusicbills:
                publicMusicbillContent
            case .lyrics:
                lyricContent
            }
        }
    }

    @ViewBuilder
    private var musicContent: some View {
        if playerStore.isSearchingMusic && playerStore.searchMusicResults.isEmpty {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if !playerStore.hasSearchedMusic {
            ContentUnavailableView(
                "Search Music",
                systemImage: "magnifyingglass",
                description: Text("Search by song, alias, artist, lyricist, or composer.")
            )
        } else if playerStore.searchMusicResults.isEmpty {
            ContentUnavailableView(
                "No Results",
                systemImage: "music.note",
                description: Text("Try another keyword.")
            )
        } else {
            List {
                Section("\(playerStore.searchMusicTotal) Songs") {
                    ForEach(playerStore.searchMusicResults) { music in
                        MusicRow(
                            music: music,
                            isCurrent: playerStore.audioPlayer.currentMusic?.id == music.id,
                            isPlaying: playerStore.audioPlayer.currentMusic?.id == music.id && playerStore.audioPlayer.isPlaying
                        ) {
                            playerStore.play(music: music, in: playerStore.searchMusicResults)
                        } onAddToMusicbill: {
                            musicForMusicbillSelection = music
                        } onSaveOffline: {
                            playerStore.saveOffline(music)
                        }
                    }
                }

                if musicTotalPages > 1 {
                    Section {
                        HStack {
                            Button {
                                Task {
                                    await search(page: playerStore.searchMusicPage - 1)
                                }
                            } label: {
                                Label("Previous", systemImage: "chevron.left")
                            }
                            .disabled(playerStore.searchMusicPage <= 1 || playerStore.isSearchingMusic)

                            Spacer()

                            Text("Page \(playerStore.searchMusicPage) of \(musicTotalPages)")
                                .font(.footnote.monospacedDigit())
                                .foregroundStyle(.secondary)

                            Spacer()

                            Button {
                                Task {
                                    await search(page: playerStore.searchMusicPage + 1)
                                }
                            } label: {
                                Label("Next", systemImage: "chevron.right")
                            }
                            .disabled(playerStore.searchMusicPage >= musicTotalPages || playerStore.isSearchingMusic)
                        }
                    }
                }
            }
            .overlay {
                if playerStore.isSearchingMusic {
                    ProgressView()
                        .padding(16)
                        .background(.regularMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }
        }
    }

    @ViewBuilder
    private var artistContent: some View {
        if playerStore.isSearchingArtists && playerStore.searchArtistResults.isEmpty {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if !playerStore.hasSearchedArtists {
            ContentUnavailableView(
                "Search Artists",
                systemImage: "person.2",
                description: Text("Search by artist name or alias.")
            )
        } else if playerStore.searchArtistResults.isEmpty {
            ContentUnavailableView(
                "No Results",
                systemImage: "person.crop.circle",
                description: Text("Try another artist keyword.")
            )
        } else {
            List {
                Section("\(playerStore.searchArtistTotal) Artists") {
                    ForEach(playerStore.searchArtistResults) { artist in
                        ArtistSearchRow(artist: artist) {
                            artistForDetail = artist
                        }
                    }
                }

                if artistTotalPages > 1 {
                    Section {
                        HStack {
                            Button {
                                Task {
                                    await search(page: playerStore.searchArtistPage - 1)
                                }
                            } label: {
                                Label("Previous", systemImage: "chevron.left")
                            }
                            .disabled(playerStore.searchArtistPage <= 1 || playerStore.isSearchingArtists)

                            Spacer()

                            Text("Page \(playerStore.searchArtistPage) of \(artistTotalPages)")
                                .font(.footnote.monospacedDigit())
                                .foregroundStyle(.secondary)

                            Spacer()

                            Button {
                                Task {
                                    await search(page: playerStore.searchArtistPage + 1)
                                }
                            } label: {
                                Label("Next", systemImage: "chevron.right")
                            }
                            .disabled(playerStore.searchArtistPage >= artistTotalPages || playerStore.isSearchingArtists)
                        }
                    }
                }
            }
            .overlay {
                if playerStore.isSearchingArtists {
                    ProgressView()
                        .padding(16)
                        .background(.regularMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }
        }
    }

    @ViewBuilder
    private var publicMusicbillContent: some View {
        if playerStore.isSearchingPublicMusicbills && playerStore.searchPublicMusicbillResults.isEmpty {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if !playerStore.hasSearchedPublicMusicbills {
            ContentUnavailableView(
                "Search Public Musicbills",
                systemImage: "music.note.list",
                description: Text("Search public musicbills by name.")
            )
        } else if playerStore.searchPublicMusicbillResults.isEmpty {
            ContentUnavailableView(
                "No Results",
                systemImage: "music.note.list",
                description: Text("Try another musicbill keyword.")
            )
        } else {
            List {
                Section("\(playerStore.searchPublicMusicbillTotal) Musicbills") {
                    ForEach(playerStore.searchPublicMusicbillResults) { musicbill in
                        PublicMusicbillSearchRow(musicbill: musicbill) {
                            publicMusicbillForDetail = musicbill
                        }
                    }
                }

                if publicMusicbillTotalPages > 1 {
                    Section {
                        HStack {
                            Button {
                                Task {
                                    await search(page: playerStore.searchPublicMusicbillPage - 1)
                                }
                            } label: {
                                Label("Previous", systemImage: "chevron.left")
                            }
                            .disabled(playerStore.searchPublicMusicbillPage <= 1 || playerStore.isSearchingPublicMusicbills)

                            Spacer()

                            Text("Page \(playerStore.searchPublicMusicbillPage) of \(publicMusicbillTotalPages)")
                                .font(.footnote.monospacedDigit())
                                .foregroundStyle(.secondary)

                            Spacer()

                            Button {
                                Task {
                                    await search(page: playerStore.searchPublicMusicbillPage + 1)
                                }
                            } label: {
                                Label("Next", systemImage: "chevron.right")
                            }
                            .disabled(playerStore.searchPublicMusicbillPage >= publicMusicbillTotalPages || playerStore.isSearchingPublicMusicbills)
                        }
                    }
                }
            }
            .overlay {
                if playerStore.isSearchingPublicMusicbills {
                    ProgressView()
                        .padding(16)
                        .background(.regularMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }
        }
    }

    @ViewBuilder
    private var lyricContent: some View {
        if playerStore.isSearchingLyrics && playerStore.searchLyricResults.isEmpty {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if !playerStore.hasSearchedLyrics {
            ContentUnavailableView(
                "Search Lyrics",
                systemImage: "text.quote",
                description: Text("Search matching lyric lines across songs.")
            )
        } else if playerStore.searchLyricResults.isEmpty {
            ContentUnavailableView(
                "No Results",
                systemImage: "text.quote",
                description: Text("Try another lyric keyword.")
            )
        } else {
            List {
                Section("\(playerStore.searchLyricTotal) Songs") {
                    ForEach(playerStore.searchLyricResults) { result in
                        MusicRow(
                            music: result.music,
                            isCurrent: playerStore.audioPlayer.currentMusic?.id == result.music.id,
                            isPlaying: playerStore.audioPlayer.currentMusic?.id == result.music.id && playerStore.audioPlayer.isPlaying,
                            lyricSnippet: result.snippetLines,
                            lyricKeyword: playerStore.searchLyricKeyword
                        ) {
                            playerStore.play(
                                music: result.music,
                                in: playerStore.searchLyricResults.map(\.music)
                            )
                        } onAddToMusicbill: {
                            musicForMusicbillSelection = result.music
                        } onSaveOffline: {
                            playerStore.saveOffline(result.music)
                        }
                    }
                }

                if lyricTotalPages > 1 {
                    Section {
                        HStack {
                            Button {
                                Task {
                                    await search(page: playerStore.searchLyricPage - 1)
                                }
                            } label: {
                                Label("Previous", systemImage: "chevron.left")
                            }
                            .disabled(playerStore.searchLyricPage <= 1 || playerStore.isSearchingLyrics)

                            Spacer()

                            Text("Page \(playerStore.searchLyricPage) of \(lyricTotalPages)")
                                .font(.footnote.monospacedDigit())
                                .foregroundStyle(.secondary)

                            Spacer()

                            Button {
                                Task {
                                    await search(page: playerStore.searchLyricPage + 1)
                                }
                            } label: {
                                Label("Next", systemImage: "chevron.right")
                            }
                            .disabled(playerStore.searchLyricPage >= lyricTotalPages || playerStore.isSearchingLyrics)
                        }
                    }
                }
            }
            .overlay {
                if playerStore.isSearchingLyrics {
                    ProgressView()
                        .padding(16)
                        .background(.regularMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }
        }
    }

    private var trimmedSearchText: String {
        searchText.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var isSearchMode: Bool {
        !trimmedSearchText.isEmpty
    }

    private var isSearching: Bool {
        switch selectedTab {
        case .music:
            return playerStore.isSearchingMusic
        case .artists:
            return playerStore.isSearchingArtists
        case .publicMusicbills:
            return playerStore.isSearchingPublicMusicbills
        case .lyrics:
            return playerStore.isSearchingLyrics
        }
    }

    private var musicTotalPages: Int {
        totalPages(total: playerStore.searchMusicTotal, pageSize: playerStore.searchMusicPageSize)
    }

    private var artistTotalPages: Int {
        totalPages(total: playerStore.searchArtistTotal, pageSize: playerStore.searchArtistPageSize)
    }

    private var publicMusicbillTotalPages: Int {
        totalPages(total: playerStore.searchPublicMusicbillTotal, pageSize: playerStore.searchPublicMusicbillPageSize)
    }

    private var lyricTotalPages: Int {
        totalPages(total: playerStore.searchLyricTotal, pageSize: playerStore.searchLyricPageSize)
    }

    private func search(page: Int) async {
        guard !trimmedSearchText.isEmpty else { return }

        switch selectedTab {
        case .music:
            await playerStore.searchMusic(keyword: searchText, page: page)
            if !playerStore.searchMusicKeyword.isEmpty {
                searchText = playerStore.searchMusicKeyword
            }
        case .artists:
            await playerStore.searchArtists(keyword: searchText, page: page)
            if !playerStore.searchArtistKeyword.isEmpty {
                searchText = playerStore.searchArtistKeyword
            }
        case .publicMusicbills:
            await playerStore.searchPublicMusicbills(keyword: searchText, page: page)
            if !playerStore.searchPublicMusicbillKeyword.isEmpty {
                searchText = playerStore.searchPublicMusicbillKeyword
            }
        case .lyrics:
            await playerStore.searchLyrics(keyword: searchText, page: page)
            if !playerStore.searchLyricKeyword.isEmpty {
                searchText = playerStore.searchLyricKeyword
            }
        }
    }

    private func syncSearchTextWithSelectedTab() {
        switch selectedTab {
        case .music:
            if !playerStore.searchMusicKeyword.isEmpty {
                searchText = playerStore.searchMusicKeyword
            }
        case .artists:
            if !playerStore.searchArtistKeyword.isEmpty {
                searchText = playerStore.searchArtistKeyword
            }
        case .publicMusicbills:
            if !playerStore.searchPublicMusicbillKeyword.isEmpty {
                searchText = playerStore.searchPublicMusicbillKeyword
            }
        case .lyrics:
            if !playerStore.searchLyricKeyword.isEmpty {
                searchText = playerStore.searchLyricKeyword
            }
        }
    }

    private func totalPages(total: Int, pageSize: Int) -> Int {
        max(1, Int(ceil(Double(total) / Double(pageSize))))
    }
}

struct ArtistSearchRow: View {
    let artist: ArtistSearchItem
    let onOpen: () -> Void

    var body: some View {
        Button(action: onOpen) {
            HStack(spacing: 12) {
                ArtworkView(
                    urlString: artist.avatar,
                    systemImage: "person.crop.square",
                    size: 50
                )

                VStack(alignment: .leading, spacing: 4) {
                    Text(artist.name)
                        .font(.headline)
                        .lineLimit(1)

                    if !artist.aliases.isEmpty {
                        Text(artist.aliases.joined(separator: " / "))
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(artist.musicCount)")
                        .font(.headline.monospacedDigit())
                    Text("Songs")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Image(systemName: "chevron.right")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(.tertiary)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

enum ArtistMusicRole: String, CaseIterable, Identifiable {
    case performer = "Performed"
    case lyricist = "Lyrics"
    case composer = "Composed"

    var id: String {
        rawValue
    }
}

struct ArtistDetailView: View {
    let artist: ArtistSearchItem
    @ObservedObject var playerStore: PlayerStore

    @Environment(\.dismiss) private var dismiss
    @State private var selectedRole = ArtistMusicRole.performer
    @State private var musicForMusicbillSelection: Music?

    private var detail: ArtistDetail? {
        playerStore.artistDetails[artist.id]
    }

    var body: some View {
        NavigationStack {
            Group {
                if let detail {
                    detailContent(detail)
                } else if playerStore.loadingArtistIDs.contains(artist.id) {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ContentUnavailableView(
                        "Artist Not Loaded",
                        systemImage: "person.crop.circle.badge.exclamationmark",
                        description: Text("Pull to refresh or try again.")
                    )
                }
            }
            .navigationTitle(detail?.name ?? artist.name)
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .sheet(item: $musicForMusicbillSelection) { music in
            AddToMusicbillSheet(
                music: music,
                playerStore: playerStore
            )
        }
        .task(id: artist.id) {
            await playerStore.loadArtist(id: artist.id)
        }
    }

    private func detailContent(_ detail: ArtistDetail) -> some View {
        let roles = availableRoles(for: detail)
        let role = roles.contains(selectedRole) ? selectedRole : roles.first ?? .performer
        let musicList = musicList(for: role, in: detail)

        return List {
            Section {
                HStack(spacing: 14) {
                    ArtworkView(
                        urlString: detail.avatar.isEmpty ? artist.avatar : detail.avatar,
                        systemImage: "person.crop.square",
                        size: 72
                    )

                    VStack(alignment: .leading, spacing: 5) {
                        Text(detail.name)
                            .font(.headline)

                        if !detail.aliases.isEmpty {
                            Text(detail.aliases.joined(separator: " / "))
                                .foregroundStyle(.secondary)
                                .lineLimit(2)
                        }

                        Text("\(uniqueMusicList(in: detail).count) songs")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 4)
            }

            if roles.count > 1 {
                Section {
                    Picker("Music Role", selection: $selectedRole) {
                        ForEach(roles) { role in
                            Text(role.rawValue).tag(role)
                        }
                    }
                    .pickerStyle(.segmented)
                }
            }

            Section(role.rawValue) {
                if musicList.isEmpty {
                    ContentUnavailableView(
                        "No Songs",
                        systemImage: "music.note",
                        description: Text("This artist has no songs in this category.")
                    )
                } else {
                    ForEach(musicList) { music in
                        MusicRow(
                            music: music,
                            isCurrent: playerStore.audioPlayer.currentMusic?.id == music.id,
                            isPlaying: playerStore.audioPlayer.currentMusic?.id == music.id && playerStore.audioPlayer.isPlaying
                        ) {
                            playerStore.play(music: music, in: musicList)
                        } onAddToMusicbill: {
                            musicForMusicbillSelection = music
                        } onSaveOffline: {
                            playerStore.saveOffline(music)
                        }
                    }
                }
            }
        }
        .refreshable {
            await playerStore.loadArtist(id: artist.id, force: true)
        }
    }

    private func availableRoles(for detail: ArtistDetail) -> [ArtistMusicRole] {
        ArtistMusicRole.allCases.filter { role in
            !musicList(for: role, in: detail).isEmpty
        }
    }

    private func musicList(for role: ArtistMusicRole, in detail: ArtistDetail) -> [Music] {
        switch role {
        case .performer:
            return detail.performerMusicList
        case .lyricist:
            return detail.lyricistMusicList
        case .composer:
            return detail.composerMusicList
        }
    }

    private func uniqueMusicList(in detail: ArtistDetail) -> [Music] {
        var seenIDs = Set<Music.ID>()
        return (detail.performerMusicList + detail.lyricistMusicList + detail.composerMusicList)
            .filter { music in
                seenIDs.insert(music.id).inserted
            }
    }
}

struct PublicMusicbillSearchRow: View {
    let musicbill: PublicMusicbillSearchItem
    let onOpen: () -> Void

    var body: some View {
        Button(action: onOpen) {
            HStack(spacing: 12) {
                ArtworkView(
                    urlString: musicbill.cover,
                    systemImage: "music.note.list",
                    size: 50
                )

                VStack(alignment: .leading, spacing: 4) {
                    Text(musicbill.name)
                        .font(.headline)
                        .lineLimit(1)
                    Text(musicbill.user.nickname)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(musicbill.musicCount)")
                        .font(.headline.monospacedDigit())
                    Text("Songs")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Image(systemName: "chevron.right")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(.tertiary)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

struct PublicMusicbillDetailView: View {
    let musicbill: PublicMusicbillSearchItem
    @ObservedObject var playerStore: PlayerStore

    @Environment(\.dismiss) private var dismiss
    @State private var musicForMusicbillSelection: Music?
    @State private var userForDetail: UserDetailTarget?

    private var detail: PublicMusicbillDetail? {
        playerStore.publicMusicbillDetails[musicbill.id]
    }

    var body: some View {
        NavigationStack {
            Group {
                if let detail {
                    detailContent(detail)
                } else if playerStore.loadingPublicMusicbillIDs.contains(musicbill.id) {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ContentUnavailableView(
                        "Musicbill Not Loaded",
                        systemImage: "music.note.list",
                        description: Text("Pull to refresh or try again.")
                    )
                }
            }
            .navigationTitle(detail?.name ?? musicbill.name)
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }

                if let detail {
                    ToolbarItem(placement: .primaryAction) {
                        Button {
                            Task {
                                await playerStore.setPublicMusicbillCollected(
                                    id: detail.id,
                                    collected: !detail.collected
                                )
                            }
                        } label: {
                            Image(systemName: detail.collected ? "star.fill" : "star")
                        }
                        .disabled(playerStore.collectingPublicMusicbillIDs.contains(detail.id))
                        .help(detail.collected ? "Uncollect Musicbill" : "Collect Musicbill")
                    }
                }
            }
        }
        .sheet(item: $musicForMusicbillSelection) { music in
            AddToMusicbillSheet(
                music: music,
                playerStore: playerStore
            )
        }
        .sheet(item: $userForDetail) { target in
            UserProfileView(
                userID: target.id,
                playerStore: playerStore
            )
        }
        .task(id: musicbill.id) {
            await playerStore.loadPublicMusicbill(id: musicbill.id)
        }
    }

    private func detailContent(_ detail: PublicMusicbillDetail) -> some View {
        List {
            Section {
                HStack(spacing: 14) {
                    ArtworkView(
                        urlString: detail.cover.isEmpty ? musicbill.cover : detail.cover,
                        systemImage: "music.note.list",
                        size: 72
                    )

                    VStack(alignment: .leading, spacing: 5) {
                        Text(detail.name)
                            .font(.headline)
                        Button {
                            userForDetail = UserDetailTarget(id: detail.user.id)
                        } label: {
                            Label(detail.user.nickname, systemImage: "person.crop.circle")
                                .lineLimit(1)
                        }
                        .buttonStyle(.plain)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        HStack(spacing: 10) {
                            Text("\(detail.musicList.count) songs")
                            Label(detail.collected ? "Collected" : "Public", systemImage: detail.collected ? "star.fill" : "globe")
                        }
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 4)
            }

            Section("Songs") {
                if detail.musicList.isEmpty {
                    ContentUnavailableView(
                        "No Songs",
                        systemImage: "music.note",
                        description: Text("This public musicbill does not contain songs.")
                    )
                } else {
                    ForEach(detail.musicList) { music in
                        MusicRow(
                            music: music,
                            isCurrent: playerStore.audioPlayer.currentMusic?.id == music.id,
                            isPlaying: playerStore.audioPlayer.currentMusic?.id == music.id && playerStore.audioPlayer.isPlaying
                        ) {
                            playerStore.play(music: music, in: detail.musicList)
                        } onAddToMusicbill: {
                            musicForMusicbillSelection = music
                        } onSaveOffline: {
                            playerStore.saveOffline(music)
                        }
                    }
                }
            }
        }
        .refreshable {
            await playerStore.loadPublicMusicbill(id: detail.id, force: true)
        }
    }
}
