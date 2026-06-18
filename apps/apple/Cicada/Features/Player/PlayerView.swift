import Foundation
import SwiftUI

struct PlayerView: View {
    @ObservedObject var serverStore: ServerSetupStore
    @StateObject private var playerStore = PlayerStore()
    @State private var isShowingCreateMusicbill = false
    @State private var isShowingNowPlaying = false
    @State private var isShowingQueue = false
    @State private var isShowingSearch = false

    var body: some View {
        if let server = serverStore.selectedServer,
           let user = serverStore.selectedUser {
            NavigationSplitView {
                sidebar(server: server, user: user)
            } detail: {
                detail
            }
            .safeAreaInset(edge: .bottom) {
                MiniPlayerView(audioPlayer: playerStore.audioPlayer) {
                    isShowingNowPlaying = true
                } onQueue: {
                    isShowingQueue = true
                }
            }
            .sheet(isPresented: $isShowingNowPlaying) {
                NowPlayingDetailView(
                    playerStore: playerStore,
                    audioPlayer: playerStore.audioPlayer
                )
            }
            .sheet(isPresented: $isShowingQueue) {
                QueueView(audioPlayer: playerStore.audioPlayer)
            }
            .sheet(isPresented: $isShowingCreateMusicbill) {
                MusicbillNameSheet(
                    title: "New Musicbill",
                    initialName: "",
                    submitTitle: "Create",
                    isSaving: playerStore.isSavingMusicbill
                ) { name in
                    await playerStore.createMusicbill(name: name)
                }
            }
            .sheet(isPresented: $isShowingSearch) {
                SearchMusicView(playerStore: playerStore)
            }
            .task(id: authKey(server: server, user: user)) {
                playerStore.configure(server: server, user: user)
                await playerStore.loadMusicbillList()
            }
            .task(id: server.origin) {
                await serverStore.refreshSelectedServerMetadata()
                while !Task.isCancelled {
                    try? await Task.sleep(nanoseconds: 15_000_000_000)
                    if Task.isCancelled {
                        return
                    }
                    await serverStore.refreshSelectedServerMetadata()
                }
            }
            .alert(
                "Cicada",
                isPresented: Binding(
                    get: {
                        playerStore.errorMessage != nil || playerStore.audioPlayer.errorMessage != nil
                    },
                    set: { isPresented in
                        if !isPresented {
                            playerStore.dismissError()
                        }
                    }
                )
            ) {
                Button("OK", role: .cancel) {
                    playerStore.dismissError()
                }
            } message: {
                Text(playerStore.errorMessage ?? playerStore.audioPlayer.errorMessage ?? "")
            }
            .onChange(of: playerStore.authorizationExpiredMessage) { _, message in
                guard let message else { return }
                playerStore.audioPlayer.stop()
                playerStore.acknowledgeAuthorizationExpired()
                serverStore.removeSelectedUser(message: message)
            }
        } else {
            ContentUnavailableView(
                "No User Selected",
                systemImage: "person.crop.circle.badge.exclamationmark",
                description: Text("Sign in before opening the player.")
            )
        }
    }

    private func sidebar(server: ServerRecord, user: ServerUserRecord) -> some View {
        List(selection: $playerStore.selectedMusicbillID) {
            if let warning = serverStore.selectedServerVersionWarning {
                Section {
                    Label(warning, systemImage: "exclamationmark.triangle")
                        .font(.footnote)
                        .foregroundStyle(.orange)
                }
            }

            if let metadataError = serverStore.selectedServerMetadataError {
                Section {
                    Label(metadataError, systemImage: "wifi.exclamationmark")
                        .font(.footnote)
                        .foregroundStyle(.secondary)

                    Button {
                        Task {
                            await serverStore.refreshSelectedServerMetadata()
                        }
                    } label: {
                        Label("Retry Server Check", systemImage: "arrow.clockwise")
                    }
                    .disabled(serverStore.isRefreshingSelectedServerMetadata)
                }
            }

            if playerStore.isLoadingMusicbillList && playerStore.musicbills.isEmpty {
                ProgressView()
            } else if playerStore.musicbills.isEmpty {
                Label("No musicbills", systemImage: "music.note.list")
                    .foregroundStyle(.secondary)
            }

            ForEach(playerStore.musicbills) { musicbill in
                MusicbillSidebarRow(musicbill: musicbill)
                    .tag(musicbill.id as String?)
            }
        }
        .navigationTitle("Cicada")
        .refreshable {
            await playerStore.loadMusicbillList()
        }
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                Button {
                    isShowingSearch = true
                } label: {
                    Image(systemName: "magnifyingglass")
                }
                .help("Search Music")

                Button {
                    isShowingCreateMusicbill = true
                } label: {
                    Image(systemName: "plus")
                }
                .help("New Musicbill")

                accountMenu(server: server, user: user)
            }
        }
    }

    @ViewBuilder
    private var detail: some View {
        if let selectedMusicbillID = playerStore.selectedMusicbillID {
            MusicbillDetailView(
                playerStore: playerStore,
                musicbillID: selectedMusicbillID
            )
        } else {
            ContentUnavailableView(
                "No Musicbill",
                systemImage: "music.note.list",
                description: Text("Choose a musicbill from the sidebar.")
            )
        }
    }

    private func accountMenu(server: ServerRecord, user: ServerUserRecord) -> some View {
        Menu {
            Button {
                playerStore.audioPlayer.stop()
                serverStore.clearSelectedUser()
            } label: {
                Label("Switch Account", systemImage: "person.2")
            }

            Button {
                playerStore.audioPlayer.stop()
                serverStore.showServerSetup()
            } label: {
                Label("Change Server", systemImage: "network")
            }

            Button(role: .destructive) {
                Task {
                    await playerStore.deleteCurrentSession()
                    playerStore.audioPlayer.stop()
                    serverStore.removeSelectedUser()
                }
            } label: {
                Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
            }
        } label: {
            Label(user.nickname, systemImage: "person.crop.circle")
        }
        .help(server.hostname)
    }

    private func authKey(server: ServerRecord, user: ServerUserRecord) -> String {
        "\(server.origin)|\(user.id)|\(user.token)"
    }
}

private struct MusicbillSidebarRow: View {
    let musicbill: MusicbillSummary

    var body: some View {
        HStack(spacing: 12) {
            ArtworkView(
                urlString: musicbill.cover,
                systemImage: "music.note.list",
                size: 36
            )

            VStack(alignment: .leading, spacing: 3) {
                Text(musicbill.name)
                    .lineLimit(1)
                Text(musicbill.owner.nickname)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
    }
}

private struct MusicbillNameSheet: View {
    let title: String
    let submitTitle: String
    let isSaving: Bool
    let onSubmit: (String) async -> Bool

    @Environment(\.dismiss) private var dismiss
    @State private var name: String

    init(
        title: String,
        initialName: String,
        submitTitle: String,
        isSaving: Bool,
        onSubmit: @escaping (String) async -> Bool
    ) {
        self.title = title
        self.submitTitle = submitTitle
        self.isSaving = isSaving
        self.onSubmit = onSubmit
        _name = State(initialValue: initialName)
    }

    private var trimmedName: String {
        name.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var canSubmit: Bool {
        !trimmedName.isEmpty && trimmedName.count <= 64 && !isSaving
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Name", text: $name)
                        .onSubmit {
                            guard canSubmit else { return }
                            Task {
                                await submit()
                            }
                        }

                    LabeledContent("Characters", value: "\(trimmedName.count)/64")
                        .font(.footnote)
                        .foregroundStyle(trimmedName.count > 64 ? Color.red : Color.secondary)
                }
            }
            .navigationTitle(title)
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .disabled(isSaving)
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        Task {
                            await submit()
                        }
                    } label: {
                        if isSaving {
                            ProgressView()
                        } else {
                            Text(submitTitle)
                        }
                    }
                    .disabled(!canSubmit)
                }
            }
        }
    }

    private func submit() async {
        let didSave = await onSubmit(trimmedName)
        if didSave {
            dismiss()
        }
    }
}

private enum MusicbillCaptchaAction: Identifiable, Equatable {
    case unpublish(id: MusicbillDetail.ID, name: String)
    case delete(id: MusicbillDetail.ID, name: String)

    var id: String {
        switch self {
        case .unpublish(let id, _):
            return "unpublish-\(id)"
        case .delete(let id, _):
            return "delete-\(id)"
        }
    }

    var musicbillID: MusicbillDetail.ID {
        switch self {
        case .unpublish(let id, _), .delete(let id, _):
            return id
        }
    }

    var title: String {
        switch self {
        case .unpublish:
            return "Make Private"
        case .delete:
            return "Delete Musicbill"
        }
    }

    var confirmTitle: String {
        switch self {
        case .unpublish:
            return "Make Private"
        case .delete:
            return "Delete"
        }
    }

    var message: String {
        switch self {
        case .unpublish(_, let name):
            return "\"\(name)\" will become private. Existing public collections for this musicbill will be removed."
        case .delete(_, let name):
            return "\"\(name)\" will be deleted. This cannot be undone."
        }
    }

    var systemImage: String {
        switch self {
        case .unpublish:
            return "lock"
        case .delete:
            return "trash"
        }
    }
}

private struct MusicbillCaptchaActionSheet: View {
    let action: MusicbillCaptchaAction
    @ObservedObject var playerStore: PlayerStore

    @Environment(\.dismiss) private var dismiss
    @State private var captchaValue = ""

    private var trimmedCaptchaValue: String {
        captchaValue.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var canSubmit: Bool {
        playerStore.musicbillActionCaptcha != nil &&
            !trimmedCaptchaValue.isEmpty &&
            !playerStore.isSavingMusicbill &&
            !playerStore.isLoadingMusicbillActionCaptcha
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Label(action.message, systemImage: action.systemImage)
                        .foregroundStyle(.secondary)
                }

                Section("Captcha") {
                    captchaBlock

                    TextField("Captcha", text: $captchaValue)
                        #if os(iOS)
                        .textInputAutocapitalization(.never)
                        #endif
                        .autocorrectionDisabled()
                        .onSubmit {
                            guard canSubmit else { return }
                            Task {
                                await submit()
                            }
                        }
                }
            }
            .navigationTitle(action.title)
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .disabled(playerStore.isSavingMusicbill)
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button(role: .destructive) {
                        Task {
                            await submit()
                        }
                    } label: {
                        if playerStore.isSavingMusicbill {
                            ProgressView()
                        } else {
                            Text(action.confirmTitle)
                        }
                    }
                    .disabled(!canSubmit)
                }
            }
        }
        .task(id: action.id) {
            captchaValue = ""
            await playerStore.loadMusicbillActionCaptcha(force: true)
        }
        .onDisappear {
            if !playerStore.isSavingMusicbill {
                playerStore.clearMusicbillActionCaptcha()
            }
        }
    }

    private var captchaBlock: some View {
        HStack {
            Group {
                if let captcha = playerStore.musicbillActionCaptcha {
                    CaptchaImageView(svg: captcha.svg)
                } else if playerStore.isLoadingMusicbillActionCaptcha {
                    ProgressView()
                } else {
                    Image(systemName: "checkmark.shield")
                        .foregroundStyle(.secondary)
                }
            }
            .frame(width: 160, height: 54)
            .background(Color.cicadaSecondaryBackground)
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

            Button {
                Task {
                    captchaValue = ""
                    await playerStore.loadMusicbillActionCaptcha(force: true)
                }
            } label: {
                Label("Refresh", systemImage: "arrow.clockwise")
            }
            .disabled(playerStore.isLoadingMusicbillActionCaptcha || playerStore.isSavingMusicbill)
        }
    }

    private func submit() async {
        let didSave: Bool
        switch action {
        case .unpublish(let id, _):
            didSave = await playerStore.unpublishMusicbill(
                id: id,
                captchaValue: trimmedCaptchaValue
            )
        case .delete(let id, _):
            didSave = await playerStore.deleteMusicbill(
                id: id,
                captchaValue: trimmedCaptchaValue
            )
        }

        if didSave {
            dismiss()
        } else {
            captchaValue = ""
            await playerStore.loadMusicbillActionCaptcha(force: true)
        }
    }
}

private struct AddToMusicbillSheet: View {
    let music: Music
    @ObservedObject var playerStore: PlayerStore

    @Environment(\.dismiss) private var dismiss
    @State private var workingMusicbillID: MusicbillSummary.ID?
    @State private var isShowingCreateMusicbill = false

    var body: some View {
        NavigationStack {
            Group {
                if playerStore.musicbills.isEmpty {
                    ContentUnavailableView(
                        "No Musicbills",
                        systemImage: "music.note.list",
                        description: Text("Create a musicbill before adding songs.")
                    )
                } else {
                    List {
                        Section {
                            ForEach(playerStore.musicbills) { musicbill in
                                AddToMusicbillRow(
                                    musicbill: musicbill,
                                    containsMusic: playerStore.containsMusic(music.id, in: musicbill.id),
                                    isLoading: playerStore.loadingMusicbillIDs.contains(musicbill.id),
                                    isWorking: workingMusicbillID == musicbill.id
                                ) {
                                    await toggleMusic(in: musicbill)
                                }
                                .task(id: musicbill.id) {
                                    await playerStore.loadMusicbill(id: musicbill.id)
                                }
                            }
                        } footer: {
                            Text("Tap a musicbill to add or remove this song.")
                        }
                    }
                }
            }
            .navigationTitle("Add to Musicbill")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .primaryAction) {
                    Button {
                        isShowingCreateMusicbill = true
                    } label: {
                        Image(systemName: "plus")
                    }
                    .disabled(playerStore.isSavingMusicbill)
                    .help("New Musicbill")
                }
            }
        }
        .sheet(isPresented: $isShowingCreateMusicbill) {
            MusicbillNameSheet(
                title: "New Musicbill",
                initialName: "",
                submitTitle: "Create",
                isSaving: playerStore.isSavingMusicbill
            ) { name in
                await playerStore.createMusicbill(name: name)
            }
        }
    }

    private func toggleMusic(in musicbill: MusicbillSummary) async {
        guard workingMusicbillID == nil, !playerStore.isSavingMusicbill else { return }
        workingMusicbillID = musicbill.id
        defer { workingMusicbillID = nil }

        if playerStore.containsMusic(music.id, in: musicbill.id) == nil {
            await playerStore.loadMusicbill(id: musicbill.id, force: true)
        }

        if playerStore.containsMusic(music.id, in: musicbill.id) == true {
            _ = await playerStore.removeMusic(music, from: musicbill.id)
        } else {
            _ = await playerStore.addMusic(music, to: musicbill.id)
        }
    }
}

private struct AddToMusicbillRow: View {
    let musicbill: MusicbillSummary
    let containsMusic: Bool?
    let isLoading: Bool
    let isWorking: Bool
    let onToggle: () async -> Void

    private var isDisabled: Bool {
        isWorking || (isLoading && containsMusic == nil)
    }

    var body: some View {
        Button {
            Task {
                await onToggle()
            }
        } label: {
            HStack(spacing: 12) {
                statusIcon

                ArtworkView(
                    urlString: musicbill.cover,
                    systemImage: "music.note.list",
                    size: 42
                )

                VStack(alignment: .leading, spacing: 3) {
                    Text(musicbill.name)
                        .lineLimit(1)

                    HStack(spacing: 6) {
                        Text(musicbill.owner.nickname)
                            .lineLimit(1)

                        if musicbill.isPublic {
                            Label("Public", systemImage: "globe")
                                .labelStyle(.titleAndIcon)
                                .lineLimit(1)
                        }
                    }
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                }

                Spacer()
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(isDisabled)
    }

    @ViewBuilder
    private var statusIcon: some View {
        if isWorking {
            ProgressView()
                .frame(width: 24, height: 24)
        } else if containsMusic == true {
            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(.tint)
                .font(.title3)
                .frame(width: 24, height: 24)
        } else if isLoading {
            ProgressView()
                .frame(width: 24, height: 24)
        } else {
            Image(systemName: "circle")
                .foregroundStyle(.secondary)
                .font(.title3)
                .frame(width: 24, height: 24)
        }
    }
}

private struct SearchMusicView: View {
    @ObservedObject var playerStore: PlayerStore

    @Environment(\.dismiss) private var dismiss
    @State private var searchText = ""
    @State private var musicForMusicbillSelection: Music?

    private var totalPages: Int {
        max(1, Int(ceil(Double(playerStore.searchMusicTotal) / Double(playerStore.searchMusicPageSize))))
    }

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Search")
                #if os(iOS)
                .navigationBarTitleDisplayMode(.inline)
                #endif
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Done") {
                            dismiss()
                        }
                    }

                    ToolbarItem(placement: .primaryAction) {
                        Button {
                            Task {
                                await search(page: 1)
                            }
                        } label: {
                            Image(systemName: "magnifyingglass")
                        }
                        .disabled(trimmedSearchText.isEmpty || playerStore.isSearchingMusic)
                        .help("Search")
                    }
                }
        }
        .searchable(text: $searchText, prompt: "Music")
        .onSubmit(of: .search) {
            Task {
                await search(page: 1)
            }
        }
        .sheet(item: $musicForMusicbillSelection) { music in
            AddToMusicbillSheet(
                music: music,
                playerStore: playerStore
            )
        }
    }

    @ViewBuilder
    private var content: some View {
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
                        }
                    }
                }

                if totalPages > 1 {
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

                            Text("Page \(playerStore.searchMusicPage) of \(totalPages)")
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
                            .disabled(playerStore.searchMusicPage >= totalPages || playerStore.isSearchingMusic)
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

    private var trimmedSearchText: String {
        searchText.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func search(page: Int) async {
        await playerStore.searchMusic(keyword: searchText, page: page)
        if !playerStore.searchMusicKeyword.isEmpty {
            searchText = playerStore.searchMusicKeyword
        }
    }
}

private struct MusicbillDetailView: View {
    @ObservedObject var playerStore: PlayerStore
    let musicbillID: MusicbillDetail.ID
    @State private var isShowingRenameSheet = false
    @State private var isConfirmingPublish = false
    @State private var captchaAction: MusicbillCaptchaAction?
    @State private var musicForMusicbillSelection: Music?

    private var detail: MusicbillDetail? {
        playerStore.musicbillDetails[musicbillID]
    }

    var body: some View {
        Group {
            if let detail {
                musicList(detail)
            } else if playerStore.loadingMusicbillIDs.contains(musicbillID) {
                ProgressView()
            } else {
                ContentUnavailableView(
                    "Musicbill Not Loaded",
                    systemImage: "music.note.list",
                    description: Text("Pull to refresh or choose another musicbill.")
                )
            }
        }
        .navigationTitle(detail?.name ?? playerStore.summary(for: musicbillID)?.name ?? "Musicbill")
        .toolbar {
            if let detail {
                ToolbarItem(placement: .primaryAction) {
                    musicbillMenu(detail)
                }
            }
        }
        .sheet(isPresented: $isShowingRenameSheet) {
            MusicbillNameSheet(
                title: "Rename Musicbill",
                initialName: detail?.name ?? playerStore.summary(for: musicbillID)?.name ?? "",
                submitTitle: "Save",
                isSaving: playerStore.isSavingMusicbill
            ) { name in
                await playerStore.renameMusicbill(id: musicbillID, name: name)
            }
        }
        .sheet(item: $captchaAction) { action in
            MusicbillCaptchaActionSheet(
                action: action,
                playerStore: playerStore
            )
        }
        .sheet(item: $musicForMusicbillSelection) { music in
            AddToMusicbillSheet(
                music: music,
                playerStore: playerStore
            )
        }
        .confirmationDialog(
            "Make this musicbill public?",
            isPresented: $isConfirmingPublish,
            titleVisibility: .visible
        ) {
            Button("Make Public") {
                Task {
                    await playerStore.publishMusicbill(id: musicbillID)
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Anyone can view a public musicbill.")
        }
        .task(id: musicbillID) {
            await playerStore.loadMusicbill(id: musicbillID)
        }
        .refreshable {
            await playerStore.loadMusicbill(id: musicbillID, force: true)
        }
    }

    private func musicbillMenu(_ detail: MusicbillDetail) -> some View {
        Menu {
            Button {
                isShowingRenameSheet = true
            } label: {
                Label("Rename", systemImage: "pencil")
            }

            if !detail.isPublic {
                Button {
                    isConfirmingPublish = true
                } label: {
                    Label("Make Public", systemImage: "globe")
                }
            } else {
                Button(role: .destructive) {
                    captchaAction = .unpublish(id: detail.id, name: detail.name)
                } label: {
                    Label("Make Private", systemImage: "lock")
                }
            }

            if playerStore.canDeleteMusicbill(detail) {
                Divider()

                Button(role: .destructive) {
                    captchaAction = .delete(id: detail.id, name: detail.name)
                } label: {
                    Label("Delete", systemImage: "trash")
                }
            }
        } label: {
            Image(systemName: "ellipsis.circle")
        }
        .help("Musicbill Actions")
    }

    private func musicList(_ detail: MusicbillDetail) -> some View {
        List {
            Section {
                HStack(spacing: 14) {
                    ArtworkView(
                        urlString: detail.cover,
                        systemImage: "music.note.list",
                        size: 72
                    )

                    VStack(alignment: .leading, spacing: 5) {
                        Text(detail.name)
                            .font(.headline)
                        Text(detail.owner.nickname)
                            .foregroundStyle(.secondary)
                        Text("\(detail.musicList.count) songs")
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
                        description: Text("This musicbill does not contain songs yet.")
                    )
                } else {
                    ForEach(detail.musicList) { music in
                        MusicRow(
                            music: music,
                            isCurrent: playerStore.audioPlayer.currentMusic?.id == music.id,
                            isPlaying: playerStore.audioPlayer.currentMusic?.id == music.id && playerStore.audioPlayer.isPlaying
                        ) {
                            playerStore.play(music: music, in: detail)
                        } onAddToMusicbill: {
                            musicForMusicbillSelection = music
                        } onRemoveFromMusicbill: {
                            Task {
                                await playerStore.removeMusic(music, from: detail.id)
                            }
                        }
                    }
                }
            }
        }
    }
}

private struct MusicRow: View {
    let music: Music
    let isCurrent: Bool
    let isPlaying: Bool
    let onPlay: () -> Void
    let onAddToMusicbill: () -> Void
    var onRemoveFromMusicbill: (() -> Void)? = nil

    var body: some View {
        Button(action: onPlay) {
            HStack(spacing: 12) {
                ArtworkView(
                    urlString: music.coverThumbnail?.isEmpty == false ? music.coverThumbnail : music.cover,
                    systemImage: "music.note",
                    size: 44
                )

                VStack(alignment: .leading, spacing: 3) {
                    Text(music.name)
                        .lineLimit(1)
                    Text(music.performerLine)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                Spacer()

                if isCurrent {
                    Image(systemName: isPlaying ? "speaker.wave.2.fill" : "pause.circle")
                        .foregroundStyle(.tint)
                }
            }
        }
        .buttonStyle(.plain)
        .contextMenu {
            Button(action: onAddToMusicbill) {
                Label("Add to Musicbill", systemImage: "text.badge.plus")
            }

            if let onRemoveFromMusicbill {
                Button(role: .destructive, action: onRemoveFromMusicbill) {
                    Label("Remove from This Musicbill", systemImage: "minus.circle")
                }
            }
        }
        .swipeActions(edge: .leading, allowsFullSwipe: false) {
            Button(action: onAddToMusicbill) {
                Label("Add", systemImage: "text.badge.plus")
            }
            .tint(.accentColor)
        }
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            if let onRemoveFromMusicbill {
                Button(role: .destructive, action: onRemoveFromMusicbill) {
                    Label("Remove", systemImage: "minus.circle")
                }
            }
        }
    }
}

private enum NowPlayingLyricState: Equatable {
    case idle
    case loading
    case instrumental
    case empty
    case loaded([LyricItem])
    case failed(String)
}

private struct NowPlayingDetailView: View {
    @ObservedObject var playerStore: PlayerStore
    @ObservedObject var audioPlayer: AudioPlayerController
    @Environment(\.dismiss) private var dismiss
    @State private var lyricState: NowPlayingLyricState = .idle
    @State private var musicForMusicbillSelection: Music?

    var body: some View {
        NavigationStack {
            Group {
                if let music = audioPlayer.currentMusic {
                    ScrollView {
                        VStack(spacing: 24) {
                            ArtworkView(
                                urlString: music.cover.isEmpty ? music.coverThumbnail : music.cover,
                                systemImage: "music.note",
                                size: 260
                            )
                            .shadow(radius: 12, y: 6)

                            titleBlock(for: music)
                            progressBlock
                            detailTransportControls
                            metadataBlock(for: music)
                            lyricsBlock(for: music)
                        }
                        .frame(maxWidth: 520)
                        .frame(maxWidth: .infinity)
                        .padding()
                    }
                } else {
                    ContentUnavailableView(
                        "No Music Playing",
                        systemImage: "music.note",
                        description: Text("Play a song before opening Now Playing.")
                    )
                }
            }
            .navigationTitle("Now Playing")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .primaryAction) {
                    if let music = audioPlayer.currentMusic {
                        Button {
                            musicForMusicbillSelection = music
                        } label: {
                            Image(systemName: "text.badge.plus")
                        }
                        .help("Add to Musicbill")
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
        .task(id: audioPlayer.currentMusic?.id) {
            guard let music = audioPlayer.currentMusic else {
                lyricState = .idle
                return
            }
            await loadLyrics(for: music)
        }
    }

    private func titleBlock(for music: Music) -> some View {
        VStack(spacing: 6) {
            Text(music.name)
                .font(.title2.bold())
                .multilineTextAlignment(.center)

            if let alias = music.aliases.first {
                Text(alias)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            Text(music.performerLine)
                .font(.headline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }

    @ViewBuilder
    private var progressBlock: some View {
        if audioPlayer.duration > 0 {
            VStack(spacing: 8) {
                Slider(
                    value: Binding(
                        get: {
                            min(audioPlayer.currentTime, audioPlayer.duration)
                        },
                        set: { value in
                            audioPlayer.currentTime = value
                        }
                    ),
                    in: 0...max(audioPlayer.duration, 1),
                    onEditingChanged: { isEditing in
                        if !isEditing {
                            audioPlayer.seek(to: audioPlayer.currentTime)
                        }
                    }
                )

                HStack {
                    Text(formatPlaybackTime(audioPlayer.currentTime))
                    Spacer()
                    Text(formatPlaybackTime(audioPlayer.duration))
                }
                .font(.caption.monospacedDigit())
                .foregroundStyle(.secondary)
            }
        }
    }

    private var detailTransportControls: some View {
        HStack(spacing: 24) {
            Button {
                audioPlayer.previous()
            } label: {
                Image(systemName: "backward.fill")
            }
            .help("Previous")

            Button {
                audioPlayer.togglePlayback()
            } label: {
                Image(systemName: audioPlayer.isPlaying ? "pause.fill" : "play.fill")
                    .frame(width: 28, height: 28)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .help(audioPlayer.isPlaying ? "Pause" : "Play")

            Button {
                audioPlayer.next()
            } label: {
                Image(systemName: "forward.fill")
            }
            .help("Next")
        }
        .font(.title3)
    }

    private func metadataBlock(for music: Music) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Details")
                .font(.headline)

            VStack(spacing: 10) {
                detailRow("Type", music.type == 2 ? "Instrumental" : "Song")
                detailRow("Performers", artistLine(music.performers))

                if !music.lyricists.isEmpty {
                    detailRow("Lyricists", artistLine(music.lyricists))
                }

                if !music.composers.isEmpty {
                    detailRow("Composers", artistLine(music.composers))
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func detailRow(_ title: String, _ value: String) -> some View {
        LabeledContent {
            Text(value)
                .multilineTextAlignment(.trailing)
        } label: {
            Text(title)
        }
        .font(.subheadline)
    }

    private func lyricsBlock(for music: Music) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Lyrics")
                    .font(.headline)

                Spacer()

                if case .failed = lyricState {
                    Button {
                        Task {
                            await loadLyrics(for: music)
                        }
                    } label: {
                        Label("Retry", systemImage: "arrow.clockwise")
                    }
                    .buttonStyle(.borderless)
                }
            }

            lyricContent
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private var lyricContent: some View {
        switch lyricState {
        case .idle, .loading:
            HStack(spacing: 10) {
                ProgressView()
                Text("Loading Lyrics")
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, minHeight: 120)

        case .instrumental:
            Label("Instrumental tracks do not have lyrics.", systemImage: "music.note")
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, minHeight: 120)

        case .empty:
            Label("No lyrics", systemImage: "text.quote")
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, minHeight: 120)

        case .loaded(let lyrics):
            let lines = parseLyricItems(lyrics)
            if lines.isEmpty {
                Label("No lyrics", systemImage: "text.quote")
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, minHeight: 120)
            } else {
                LyricLinesView(
                    lines: lines,
                    currentTime: audioPlayer.currentTime
                )
            }

        case .failed(let message):
            Label(message, systemImage: "exclamationmark.triangle")
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, minHeight: 120)
        }
    }

    private func loadLyrics(for music: Music) async {
        lyricState = .loading
        let result = await playerStore.loadLyrics(for: music)
        guard !Task.isCancelled, audioPlayer.currentMusic?.id == music.id else {
            return
        }

        switch result {
        case .instrumental:
            lyricState = .instrumental
        case .empty:
            lyricState = .empty
        case .loaded(let lyrics):
            lyricState = .loaded(lyrics)
        case .failed(let message):
            lyricState = .failed(message)
        }
    }

    private func artistLine(_ artists: [ArtistSummary]) -> String {
        artists.map(\.name).joined(separator: ", ")
    }
}

private struct QueueView: View {
    @ObservedObject var audioPlayer: AudioPlayerController
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Group {
                if audioPlayer.queue.isEmpty {
                    ContentUnavailableView(
                        "Queue Empty",
                        systemImage: "list.bullet",
                        description: Text("Play a song to start a queue.")
                    )
                } else {
                    List {
                        Section("\(audioPlayer.queue.count) Songs") {
                            ForEach(Array(audioPlayer.queue.enumerated()), id: \.offset) { index, music in
                                Button {
                                    audioPlayer.playQueueItem(at: index)
                                } label: {
                                    QueueRow(
                                        index: index,
                                        music: music,
                                        isCurrent: index == audioPlayer.currentQueueIndex,
                                        isPlaying: index == audioPlayer.currentQueueIndex && audioPlayer.isPlaying
                                    )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Queue")
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
    }
}

private struct QueueRow: View {
    let index: Int
    let music: Music
    let isCurrent: Bool
    let isPlaying: Bool

    var body: some View {
        HStack(spacing: 12) {
            Text("\(index + 1)")
                .font(.caption.monospacedDigit())
                .foregroundStyle(.secondary)
                .frame(width: 28, alignment: .trailing)

            ArtworkView(
                urlString: music.coverThumbnail?.isEmpty == false ? music.coverThumbnail : music.cover,
                systemImage: "music.note",
                size: 44
            )

            VStack(alignment: .leading, spacing: 3) {
                Text(music.name)
                    .lineLimit(1)
                Text(music.performerLine)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }

            Spacer()

            if isCurrent {
                Image(systemName: isPlaying ? "speaker.wave.2.fill" : "pause.circle")
                    .foregroundStyle(.tint)
            }
        }
        .contentShape(Rectangle())
    }
}

private struct LyricTimelineLine: Identifiable, Equatable {
    let id: String
    let time: Double?
    let texts: [String]
}

private struct LyricLinesView: View {
    let lines: [LyricTimelineLine]
    let currentTime: Double

    private var activeLineID: String? {
        lines
            .filter { line in
                guard let time = line.time else { return false }
                return time <= currentTime + 0.25
            }
            .last?
            .id
    }

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 14) {
                    ForEach(lines) { line in
                        lyricLine(line)
                            .id(line.id)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
            }
            .frame(height: 320)
            .onAppear {
                scrollToActiveLine(with: proxy)
            }
            .onChange(of: activeLineID) { _, _ in
                scrollToActiveLine(with: proxy)
            }
        }
    }

    private func lyricLine(_ line: LyricTimelineLine) -> some View {
        let isActive = line.id == activeLineID

        return VStack(spacing: 4) {
            ForEach(Array(line.texts.enumerated()), id: \.offset) { _, text in
                Text(text)
                    .font(isActive ? .headline : .body)
                    .fontWeight(isActive ? .semibold : .regular)
                    .foregroundStyle(isActive ? Color.accentColor : Color.primary)
                    .multilineTextAlignment(.center)
                    .lineLimit(nil)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 8)
        .animation(.easeInOut(duration: 0.2), value: isActive)
    }

    private func scrollToActiveLine(with proxy: ScrollViewProxy) {
        guard let activeLineID else { return }
        withAnimation(.easeInOut(duration: 0.25)) {
            proxy.scrollTo(activeLineID, anchor: .center)
        }
    }
}

private struct MiniPlayerView: View {
    @ObservedObject var audioPlayer: AudioPlayerController
    let onDetails: () -> Void
    let onQueue: () -> Void

    var body: some View {
        if let music = audioPlayer.currentMusic {
            VStack(spacing: 8) {
                Divider()
                ViewThatFits(in: .horizontal) {
                    regularControls(for: music)
                    compactControls(for: music)
                }

                if audioPlayer.duration > 0 {
                    HStack(spacing: 10) {
                        Text(formatPlaybackTime(audioPlayer.currentTime))
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(.secondary)

                        Slider(
                            value: Binding(
                                get: {
                                    min(audioPlayer.currentTime, audioPlayer.duration)
                                },
                                set: { value in
                                    audioPlayer.currentTime = value
                                }
                            ),
                            in: 0...max(audioPlayer.duration, 1),
                            onEditingChanged: { isEditing in
                                if !isEditing {
                                    audioPlayer.seek(to: audioPlayer.currentTime)
                                }
                            }
                        )

                        Text(formatPlaybackTime(audioPlayer.duration))
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .padding(.horizontal)
            .padding(.top, 8)
            .padding(.bottom, 6)
            .background(.bar)
        }
    }

    private func regularControls(for music: Music) -> some View {
        HStack(spacing: 12) {
            nowPlayingButton(for: music, artworkSize: 44)

            Spacer()

            transportControls
            queueButton
        }
    }

    private func compactControls(for music: Music) -> some View {
        VStack(spacing: 8) {
            HStack(spacing: 12) {
                nowPlayingButton(for: music, artworkSize: 40)

                Spacer()

                queueButton
            }

            transportControls
        }
    }

    private func nowPlayingButton(for music: Music, artworkSize: CGFloat) -> some View {
        Button(action: onDetails) {
            nowPlayingSummary(for: music, artworkSize: artworkSize)
        }
        .buttonStyle(.plain)
        .contentShape(Rectangle())
        .help("Now Playing")
    }

    private func nowPlayingSummary(for music: Music, artworkSize: CGFloat) -> some View {
        HStack(spacing: 12) {
            ArtworkView(
                urlString: music.coverThumbnail?.isEmpty == false ? music.coverThumbnail : music.cover,
                systemImage: "music.note",
                size: artworkSize
            )

            VStack(alignment: .leading, spacing: 2) {
                Text(music.name)
                    .font(.headline)
                    .lineLimit(1)
                Text(music.performerLine)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            .frame(minWidth: 0, alignment: .leading)
        }
    }

    private var transportControls: some View {
        HStack(spacing: 12) {
            Button {
                audioPlayer.previous()
            } label: {
                Image(systemName: "backward.fill")
            }
            .help("Previous")

            Button {
                audioPlayer.togglePlayback()
            } label: {
                Image(systemName: audioPlayer.isPlaying ? "pause.fill" : "play.fill")
            }
            .buttonStyle(.borderedProminent)
            .help(audioPlayer.isPlaying ? "Pause" : "Play")

            Button {
                audioPlayer.next()
            } label: {
                Image(systemName: "forward.fill")
            }
            .help("Next")
        }
    }

    private var queueButton: some View {
        Button(action: onQueue) {
            Image(systemName: "list.bullet")
        }
        .disabled(audioPlayer.queue.isEmpty)
        .help("Queue")
    }

}

private struct ParsedLyricEntry {
    let timeMillis: Int?
    let text: String
    let sourceIndex: Int
    let sequence: Int
}

private func parseLyricItems(_ lyrics: [LyricItem]) -> [LyricTimelineLine] {
    let entries = lyrics.enumerated().flatMap { sourceIndex, lyric in
        parseLRC(lyric.lrc, sourceIndex: sourceIndex)
    }
    let timedEntries = entries.filter { $0.timeMillis != nil }

    guard !timedEntries.isEmpty else {
        return entries
            .map(\.text)
            .filter { !$0.isEmpty }
            .enumerated()
            .map { index, text in
                LyricTimelineLine(
                    id: "static-\(index)",
                    time: nil,
                    texts: [text]
                )
            }
    }

    let groupedEntries = Dictionary(grouping: timedEntries) { entry in
        entry.timeMillis ?? 0
    }

    return groupedEntries.keys.sorted().map { timeMillis in
        let texts = groupedEntries[timeMillis, default: []]
            .sorted { lhs, rhs in
                if lhs.sourceIndex != rhs.sourceIndex {
                    return lhs.sourceIndex < rhs.sourceIndex
                }
                return lhs.sequence < rhs.sequence
            }
            .map(\.text)
            .filter { !$0.isEmpty }

        return LyricTimelineLine(
            id: "timed-\(timeMillis)",
            time: Double(timeMillis) / 1000,
            texts: texts.isEmpty ? [" "] : texts
        )
    }
}

private func parseLRC(_ lrc: String, sourceIndex: Int) -> [ParsedLyricEntry] {
    let pattern = #"\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]"#
    guard let regex = try? NSRegularExpression(pattern: pattern) else {
        return []
    }

    return lrc
        .components(separatedBy: .newlines)
        .enumerated()
        .flatMap { sequence, rawLine -> [ParsedLyricEntry] in
            let trimmedLine = rawLine.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmedLine.isEmpty else { return [] }

            let line = rawLine as NSString
            let range = NSRange(location: 0, length: line.length)
            let matches = regex.matches(in: rawLine, range: range)

            guard !matches.isEmpty else {
                if trimmedLine.hasPrefix("[") && trimmedLine.hasSuffix("]") {
                    return []
                }
                return [
                    ParsedLyricEntry(
                        timeMillis: nil,
                        text: trimmedLine,
                        sourceIndex: sourceIndex,
                        sequence: sequence
                    ),
                ]
            }

            let textStart = matches.map { NSMaxRange($0.range) }.max() ?? 0
            let text = line
                .substring(from: min(textStart, line.length))
                .trimmingCharacters(in: .whitespacesAndNewlines)

            return matches.compactMap { match in
                guard let timeMillis = lyricTimeMillis(from: match, in: line) else {
                    return nil
                }
                return ParsedLyricEntry(
                    timeMillis: timeMillis,
                    text: text,
                    sourceIndex: sourceIndex,
                    sequence: sequence
                )
            }
        }
}

private func lyricTimeMillis(from match: NSTextCheckingResult, in line: NSString) -> Int? {
    guard match.numberOfRanges >= 3 else { return nil }
    guard
        let minutes = Int(line.substring(with: match.range(at: 1))),
        let seconds = Int(line.substring(with: match.range(at: 2)))
    else {
        return nil
    }

    var milliseconds = 0
    if match.numberOfRanges > 3 {
        let fractionRange = match.range(at: 3)
        if fractionRange.location != NSNotFound,
           let rawMilliseconds = Int(line.substring(with: fractionRange)) {
            switch fractionRange.length {
            case 1:
                milliseconds = rawMilliseconds * 100
            case 2:
                milliseconds = rawMilliseconds * 10
            default:
                milliseconds = rawMilliseconds
            }
        }
    }

    return ((minutes * 60) + seconds) * 1000 + milliseconds
}

private func formatPlaybackTime(_ seconds: Double) -> String {
    guard seconds.isFinite else { return "0:00" }
    let totalSeconds = max(0, Int(seconds.rounded()))
    let hours = totalSeconds / 3600
    let minutes = (totalSeconds % 3600) / 60
    let remainingSeconds = totalSeconds % 60

    if hours > 0 {
        return "\(hours):\(String(format: "%02d", minutes)):\(String(format: "%02d", remainingSeconds))"
    }
    return "\(minutes):\(String(format: "%02d", remainingSeconds))"
}
