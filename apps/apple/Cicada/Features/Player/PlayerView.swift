import Foundation
import SwiftUI

struct PlayerView: View {
    @ObservedObject var serverStore: ServerSetupStore
    @StateObject private var playerStore = PlayerStore()
    @State private var isShowingCreateMusicbill = false
    @State private var isShowingNowPlaying = false
    @State private var isShowingQueue = false
    @State private var isShowingSearch = false
    @State private var isShowingProfile = false
    @State private var isShowingSharedMusicbillInvitations = false
    @State private var isShowingPublicMusicbillCollections = false

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
            .sheet(isPresented: $isShowingProfile) {
                AccountProfileView(
                    playerStore: playerStore,
                    serverStore: serverStore
                )
            }
            .sheet(isPresented: $isShowingSharedMusicbillInvitations) {
                SharedMusicbillInvitationView(playerStore: playerStore)
            }
            .sheet(isPresented: $isShowingPublicMusicbillCollections) {
                PublicMusicbillCollectionView(playerStore: playerStore)
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
                    isShowingSharedMusicbillInvitations = true
                } label: {
                    Image(systemName: "person.2")
                }
                .help("Shared Invitations")

                Button {
                    isShowingPublicMusicbillCollections = true
                } label: {
                    Image(systemName: "star")
                }
                .help("Public Collections")

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
                isShowingProfile = true
            } label: {
                Label("Profile", systemImage: "person.crop.circle")
            }

            Divider()

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

private struct UserDetailTarget: Identifiable {
    let id: String
}

private struct AccountProfileView: View {
    @ObservedObject var playerStore: PlayerStore
    @ObservedObject var serverStore: ServerSetupStore

    @Environment(\.dismiss) private var dismiss
    @State private var nickname = ""
    @State private var isShowingPasswordSheet = false
    @State private var isShowingSessions = false
    @State private var userForDetail: UserDetailTarget?

    private var user: ServerUserRecord? {
        serverStore.selectedUser
    }

    private var trimmedNickname: String {
        nickname
            .components(separatedBy: .whitespacesAndNewlines)
            .filter { !$0.isEmpty }
            .joined(separator: " ")
    }

    private var canSaveNickname: Bool {
        guard let user else { return false }
        return !playerStore.isUpdatingProfile &&
            !trimmedNickname.isEmpty &&
            trimmedNickname.count <= 32 &&
            trimmedNickname != user.nickname
    }

    var body: some View {
        NavigationStack {
            Group {
                if let user {
                    Form {
                        Section {
                            HStack(spacing: 14) {
                                ArtworkView(
                                    urlString: user.avatar,
                                    systemImage: "person.crop.square",
                                    size: 72
                                )

                                VStack(alignment: .leading, spacing: 5) {
                                    Text(user.nickname)
                                        .font(.headline)
                                    Text("@\(user.username)")
                                        .foregroundStyle(.secondary)
                                    Label(
                                        user.twoFAEnabled ? "2FA Enabled" : "2FA Disabled",
                                        systemImage: user.twoFAEnabled ? "lock.shield" : "lock.open"
                                    )
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                                }
                            }
                            .padding(.vertical, 4)
                        }

                        Section("Nickname") {
                            TextField("Nickname", text: $nickname)
                                .onChange(of: nickname) { _, value in
                                    if value.count > 32 {
                                        nickname = String(value.prefix(32))
                                    }
                                }
                                .onSubmit {
                                    guard canSaveNickname else { return }
                                    Task {
                                        await saveNickname()
                                    }
                                }

                            LabeledContent("Characters", value: "\(trimmedNickname.count)/32")
                                .font(.footnote)
                                .foregroundStyle(trimmedNickname.count > 32 ? Color.red : Color.secondary)
                        }

                        Section("Account") {
                            LabeledContent("Username", value: user.username)
                            LabeledContent("Joined", value: formatCicadaTimestamp(user.joinTimestamp, date: .abbreviated, time: .omitted))
                        }

                        Section {
                            Button {
                                Task {
                                    await saveNickname()
                                }
                            } label: {
                                if playerStore.isUpdatingProfile {
                                    ProgressView()
                                } else {
                                    Label("Save Nickname", systemImage: "checkmark")
                                }
                            }
                            .disabled(!canSaveNickname)

                            Button {
                                isShowingPasswordSheet = true
                            } label: {
                                Label("Change Password", systemImage: "key")
                            }
                            .disabled(playerStore.isChangingPassword)

                            Button {
                                isShowingSessions = true
                            } label: {
                                Label("Authorized Devices", systemImage: "desktopcomputer.and.macbook")
                            }

                            Button {
                                userForDetail = UserDetailTarget(id: user.id)
                            } label: {
                                Label("Public Profile", systemImage: "person.text.rectangle")
                            }
                        }
                    }
                } else {
                    ContentUnavailableView(
                        "No User Selected",
                        systemImage: "person.crop.circle.badge.exclamationmark",
                        description: Text("Sign in before editing profile.")
                    )
                }
            }
            .navigationTitle("Profile")
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
                            await refreshProfile()
                        }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(playerStore.isUpdatingProfile)
                    .help("Refresh Profile")
                }
            }
        }
        .sheet(isPresented: $isShowingPasswordSheet) {
            ChangePasswordSheet(
                playerStore: playerStore,
                twoFAEnabled: user?.twoFAEnabled == true
            )
        }
        .sheet(isPresented: $isShowingSessions) {
            AuthorizedDevicesView(playerStore: playerStore)
        }
        .sheet(item: $userForDetail) { target in
            UserProfileView(
                userID: target.id,
                playerStore: playerStore
            )
        }
        .task(id: user?.id) {
            nickname = user?.nickname ?? ""
            await refreshProfile()
        }
        .onChange(of: user?.nickname ?? "") { _, value in
            if !playerStore.isUpdatingProfile {
                nickname = value
            }
        }
    }

    private func refreshProfile() async {
        if let profile = await playerStore.refreshCurrentProfile() {
            serverStore.updateSelectedUser(profile: profile)
            nickname = profile.nickname
        }
    }

    private func saveNickname() async {
        guard canSaveNickname else { return }
        if let profile = await playerStore.updateNickname(nickname) {
            serverStore.updateSelectedUser(profile: profile)
            nickname = profile.nickname
        }
    }
}

private struct ChangePasswordSheet: View {
    @ObservedObject var playerStore: PlayerStore
    let twoFAEnabled: Bool

    @Environment(\.dismiss) private var dismiss
    @State private var credential = ""
    @State private var newPassword = ""
    @State private var confirmation = ""

    private var canSubmit: Bool {
        !credential.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
            newPassword.count >= 6 &&
            newPassword.count <= 32 &&
            newPassword == confirmation &&
            !playerStore.isChangingPassword
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    SecureField(
                        twoFAEnabled ? "Current Password or 2FA Token" : "Current Password",
                        text: $credential
                    )
                    SecureField("New Password", text: $newPassword)
                        .onChange(of: newPassword) { _, value in
                            if value.count > 32 {
                                newPassword = String(value.prefix(32))
                            }
                        }
                    SecureField("Confirm Password", text: $confirmation)
                        .onChange(of: confirmation) { _, value in
                            if value.count > 32 {
                                confirmation = String(value.prefix(32))
                            }
                        }
                } footer: {
                    Text("Password must be 6-32 characters.")
                }

                if !confirmation.isEmpty && newPassword != confirmation {
                    Section {
                        Label("Passwords do not match.", systemImage: "exclamationmark.triangle")
                            .foregroundStyle(.orange)
                    }
                }
            }
            .navigationTitle("Change Password")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .disabled(playerStore.isChangingPassword)
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        Task {
                            await submit()
                        }
                    } label: {
                        if playerStore.isChangingPassword {
                            ProgressView()
                        } else {
                            Text("Save")
                        }
                    }
                    .disabled(!canSubmit)
                }
            }
        }
    }

    private func submit() async {
        let didChange = await playerStore.changePassword(
            credential: credential,
            newPassword: newPassword
        )
        if didChange {
            dismiss()
        }
    }
}

private struct AuthorizedDevicesView: View {
    @ObservedObject var playerStore: PlayerStore

    @Environment(\.dismiss) private var dismiss
    @State private var sessionForRename: AuthSession?
    @State private var sessionForRevocation: AuthSession?

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Authorized Devices")
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
                                await playerStore.loadSessions(force: true)
                            }
                        } label: {
                            Image(systemName: "arrow.clockwise")
                        }
                        .disabled(playerStore.isLoadingSessions)
                        .help("Refresh Devices")
                    }
                }
        }
        .sheet(item: $sessionForRename) { session in
            RenameDeviceSheet(
                playerStore: playerStore,
                session: session
            )
        }
        .confirmationDialog(
            "Revoke Device?",
            isPresented: Binding(
                get: { sessionForRevocation != nil },
                set: { isPresented in
                    if !isPresented {
                        sessionForRevocation = nil
                    }
                }
            ),
            titleVisibility: .visible
        ) {
            if let sessionForRevocation {
                Button("Revoke", role: .destructive) {
                    Task {
                        let didRevoke = await playerStore.revokeSession(id: sessionForRevocation.id)
                        if didRevoke {
                            self.sessionForRevocation = nil
                        }
                    }
                }
            }
            Button("Cancel", role: .cancel) {
                sessionForRevocation = nil
            }
        } message: {
            if let sessionForRevocation {
                Text("Revoke \(displayDeviceName(sessionForRevocation)) from this account.")
            }
        }
        .task {
            await playerStore.loadSessions()
        }
    }

    @ViewBuilder
    private var content: some View {
        if playerStore.isLoadingSessions && playerStore.sessions.isEmpty {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if !playerStore.hasLoadedSessions {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if playerStore.sessions.isEmpty {
            ContentUnavailableView(
                "No Authorized Devices",
                systemImage: "desktopcomputer.and.macbook",
                description: Text("Signed-in devices will appear here.")
            )
        } else {
            List {
                Section {
                    ForEach(playerStore.sessions) { session in
                        AuthSessionRow(
                            session: session,
                            isUpdating: playerStore.updatingSessionIDs.contains(session.id)
                        ) {
                            sessionForRename = session
                        } onRevoke: {
                            sessionForRevocation = session
                        }
                    }
                }
            }
            .refreshable {
                await playerStore.loadSessions(force: true)
            }
            .overlay {
                if playerStore.isLoadingSessions {
                    ProgressView()
                        .padding(16)
                        .background(.regularMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }
        }
    }
}

private struct AuthSessionRow: View {
    let session: AuthSession
    let isUpdating: Bool
    let onRename: () -> Void
    let onRevoke: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: session.current ? "checkmark.circle.fill" : "desktopcomputer")
                .font(.title2)
                .foregroundStyle(session.current ? Color.accentColor : Color.secondary)
                .frame(width: 34, height: 34)

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    Text(displayDeviceName(session))
                        .font(.headline)
                        .lineLimit(1)
                    if session.current {
                        Text("Current")
                            .font(.caption2.weight(.semibold))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.accentColor.opacity(0.14))
                            .clipShape(Capsule())
                    }
                }

                Text("Last seen \(formatCicadaTimestamp(session.lastSeenTimestamp, date: .abbreviated, time: .shortened))")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)

                Text("Expires \(formatCicadaTimestamp(session.inactiveExpireTimestamp, date: .abbreviated, time: .shortened))")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .lineLimit(1)
            }

            Spacer()

            Menu {
                Button {
                    onRename()
                } label: {
                    Label("Rename", systemImage: "pencil")
                }
                .disabled(isUpdating)

                if !session.current {
                    Button(role: .destructive) {
                        onRevoke()
                    } label: {
                        Label("Revoke", systemImage: "trash")
                    }
                    .disabled(isUpdating)
                }
            } label: {
                if isUpdating {
                    ProgressView()
                } else {
                    Image(systemName: "ellipsis.circle")
                }
            }
            .disabled(isUpdating)
        }
        .padding(.vertical, 4)
    }
}

private struct RenameDeviceSheet: View {
    @ObservedObject var playerStore: PlayerStore
    let session: AuthSession

    @Environment(\.dismiss) private var dismiss
    @State private var deviceName: String

    init(playerStore: PlayerStore, session: AuthSession) {
        self.playerStore = playerStore
        self.session = session
        _deviceName = State(initialValue: displayDeviceName(session))
    }

    private var trimmedDeviceName: String {
        deviceName.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var isSaving: Bool {
        playerStore.updatingSessionIDs.contains(session.id)
    }

    private var canSubmit: Bool {
        !trimmedDeviceName.isEmpty &&
            trimmedDeviceName.count <= 64 &&
            !isSaving
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Device Name", text: $deviceName)
                        .onChange(of: deviceName) { _, value in
                            if value.count > 64 {
                                deviceName = String(value.prefix(64))
                            }
                        }
                        .onSubmit {
                            guard canSubmit else { return }
                            Task {
                                await submit()
                            }
                        }

                    LabeledContent("Characters", value: "\(trimmedDeviceName.count)/64")
                        .font(.footnote)
                        .foregroundStyle(trimmedDeviceName.count > 64 ? Color.red : Color.secondary)
                }
            }
            .navigationTitle("Rename Device")
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
                            Text("Save")
                        }
                    }
                    .disabled(!canSubmit)
                }
            }
        }
    }

    private func submit() async {
        let didRename = await playerStore.renameSession(
            id: session.id,
            deviceName: trimmedDeviceName
        )
        if didRename {
            dismiss()
        }
    }
}

private struct UserProfileView: View {
    let userID: UserDetail.ID
    @ObservedObject var playerStore: PlayerStore

    @Environment(\.dismiss) private var dismiss
    @State private var publicMusicbillForDetail: PublicMusicbillSearchItem?

    private var detail: UserDetail? {
        playerStore.userDetails[userID]
    }

    var body: some View {
        NavigationStack {
            Group {
                if let detail {
                    userContent(detail)
                } else if playerStore.loadingUserIDs.contains(userID) {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ContentUnavailableView(
                        "User Not Loaded",
                        systemImage: "person.crop.circle.badge.exclamationmark",
                        description: Text("Pull to refresh or try again.")
                    )
                }
            }
            .navigationTitle(detail?.nickname ?? "User")
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
        .sheet(item: $publicMusicbillForDetail) { musicbill in
            PublicMusicbillDetailView(
                musicbill: musicbill,
                playerStore: playerStore
            )
        }
        .task(id: userID) {
            await playerStore.loadUser(id: userID)
        }
    }

    private func userContent(_ detail: UserDetail) -> some View {
        List {
            Section {
                HStack(spacing: 14) {
                    ArtworkView(
                        urlString: detail.avatar,
                        systemImage: "person.crop.square",
                        size: 76
                    )

                    VStack(alignment: .leading, spacing: 5) {
                        Text(detail.nickname)
                            .font(.headline)
                            .lineLimit(1)
                        Text("@\(detail.username)")
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                        Text("Joined \(formatCicadaTimestamp(detail.joinTimestamp, date: .abbreviated, time: .omitted))")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 4)
            }

            Section("Public Musicbills") {
                if detail.musicbillList.isEmpty {
                    ContentUnavailableView(
                        "No Public Musicbills",
                        systemImage: "music.note.list",
                        description: Text("This user has not published musicbills.")
                    )
                } else {
                    ForEach(detail.musicbillList) { musicbill in
                        UserPublicMusicbillRow(musicbill: musicbill) {
                            publicMusicbillForDetail = musicbill.searchItem(user: detail.musicbillUser)
                        }
                    }
                }
            }
        }
        .refreshable {
            await playerStore.loadUser(id: detail.id, force: true)
        }
    }
}

private struct UserPublicMusicbillRow: View {
    let musicbill: UserPublicMusicbill
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
                    Text("\(musicbill.musicCount) songs")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(.tertiary)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
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

private struct SharedMusicbillInvitationView: View {
    @ObservedObject var playerStore: PlayerStore

    @Environment(\.dismiss) private var dismiss
    @State private var userForDetail: UserDetailTarget?

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Shared Invitations")
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
                                await playerStore.loadSharedMusicbillInvitations(force: true)
                            }
                        } label: {
                            Image(systemName: "arrow.clockwise")
                        }
                        .disabled(playerStore.isLoadingSharedMusicbillInvitations)
                        .help("Refresh Invitations")
                    }
                }
        }
        .task {
            await playerStore.loadSharedMusicbillInvitations(force: true)
        }
        .sheet(item: $userForDetail) { target in
            UserProfileView(
                userID: target.id,
                playerStore: playerStore
            )
        }
    }

    @ViewBuilder
    private var content: some View {
        if playerStore.isLoadingSharedMusicbillInvitations &&
            playerStore.sharedMusicbillInvitations.isEmpty {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if !playerStore.hasLoadedSharedMusicbillInvitations {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if playerStore.sharedMusicbillInvitations.isEmpty {
            ContentUnavailableView(
                "No Invitations",
                systemImage: "person.2",
                description: Text("Shared musicbill invitations will appear here.")
            )
        } else {
            List {
                Section {
                    Label(
                        "Invitations expire automatically after 3-4 days.",
                        systemImage: "clock"
                    )
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                }

                Section("Invitations") {
                    ForEach(playerStore.sharedMusicbillInvitations) { invitation in
                        SharedMusicbillInvitationRow(
                            invitation: invitation,
                            isAccepting: playerStore.acceptingSharedMusicbillInvitationIDs.contains(invitation.id)
                        ) {
                            userForDetail = UserDetailTarget(id: invitation.inviteUserID)
                        } onAccept: {
                            let didAccept = await playerStore.acceptSharedMusicbillInvitation(invitation)
                            if didAccept {
                                dismiss()
                            }
                        }
                    }
                }
            }
            .refreshable {
                await playerStore.loadSharedMusicbillInvitations(force: true)
            }
            .overlay {
                if playerStore.isLoadingSharedMusicbillInvitations {
                    ProgressView()
                        .padding(16)
                        .background(.regularMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }
        }
    }
}

private struct SharedMusicbillInvitationRow: View {
    let invitation: SharedMusicbillInvitation
    let isAccepting: Bool
    let onOpenUser: () -> Void
    let onAccept: () async -> Void

    private var musicbillName: String {
        invitation.musicbillName.isEmpty ? "Musicbill" : invitation.musicbillName
    }

    private var inviteDate: Date {
        let timestamp = invitation.inviteTimestamp
        let seconds = timestamp > 10_000_000_000 ? timestamp / 1000 : timestamp
        return Date(timeIntervalSince1970: seconds)
    }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "person.crop.circle.badge.plus")
                .font(.title2)
                .foregroundStyle(.tint)
                .frame(width: 34, height: 34)

            VStack(alignment: .leading, spacing: 4) {
                Button(action: onOpenUser) {
                    Label(invitation.inviteUserNickname, systemImage: "person.crop.circle")
                        .font(.headline)
                        .lineLimit(1)
                }
                .buttonStyle(.plain)

                Text(musicbillName)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)

                Text(inviteDate.formatted(date: .abbreviated, time: .shortened))
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }

            Spacer()

            Button {
                Task {
                    await onAccept()
                }
            } label: {
                if isAccepting {
                    ProgressView()
                } else {
                    Label("Accept", systemImage: "checkmark.circle")
                }
            }
            .disabled(isAccepting)
            .buttonStyle(.borderedProminent)
        }
        .padding(.vertical, 4)
    }
}

private struct PublicMusicbillCollectionView: View {
    @ObservedObject var playerStore: PlayerStore

    @Environment(\.dismiss) private var dismiss
    @State private var searchText = ""
    @State private var musicbillForDetail: PublicMusicbillSearchItem?

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Public Collections")
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
                                await load(page: 1, force: true)
                            }
                        } label: {
                            Image(systemName: "magnifyingglass")
                        }
                        .disabled(playerStore.isLoadingPublicMusicbillCollections)
                        .help("Search Collections")
                    }
                }
        }
        .searchable(text: $searchText, prompt: "Collections")
        .onSubmit(of: .search) {
            Task {
                await load(page: 1, force: true)
            }
        }
        .sheet(item: $musicbillForDetail) { musicbill in
            PublicMusicbillDetailView(
                musicbill: musicbill,
                playerStore: playerStore
            )
        }
        .task {
            searchText = playerStore.publicMusicbillCollectionKeyword
            if !playerStore.hasLoadedPublicMusicbillCollections {
                await load(page: 1)
            }
        }
    }

    @ViewBuilder
    private var content: some View {
        if playerStore.isLoadingPublicMusicbillCollections &&
            playerStore.publicMusicbillCollections.isEmpty {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if !playerStore.hasLoadedPublicMusicbillCollections {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if playerStore.publicMusicbillCollections.isEmpty {
            ContentUnavailableView(
                playerStore.publicMusicbillCollectionKeyword.isEmpty ? "No Collections" : "No Results",
                systemImage: "star",
                description: Text(
                    playerStore.publicMusicbillCollectionKeyword.isEmpty ?
                        "Collect public musicbills from Search." :
                        "Try another collection keyword."
                )
            )
        } else {
            List {
                Section("\(playerStore.publicMusicbillCollectionTotal) Musicbills") {
                    ForEach(playerStore.publicMusicbillCollections) { collection in
                        PublicMusicbillSearchRow(musicbill: collection.searchItem) {
                            musicbillForDetail = collection.searchItem
                        }
                    }
                }

                if totalPages > 1 {
                    Section {
                        HStack {
                            Button {
                                Task {
                                    await load(page: playerStore.publicMusicbillCollectionPage - 1)
                                }
                            } label: {
                                Label("Previous", systemImage: "chevron.left")
                            }
                            .disabled(
                                playerStore.publicMusicbillCollectionPage <= 1 ||
                                    playerStore.isLoadingPublicMusicbillCollections
                            )

                            Spacer()

                            Text("Page \(playerStore.publicMusicbillCollectionPage) of \(totalPages)")
                                .font(.footnote.monospacedDigit())
                                .foregroundStyle(.secondary)

                            Spacer()

                            Button {
                                Task {
                                    await load(page: playerStore.publicMusicbillCollectionPage + 1)
                                }
                            } label: {
                                Label("Next", systemImage: "chevron.right")
                            }
                            .disabled(
                                playerStore.publicMusicbillCollectionPage >= totalPages ||
                                    playerStore.isLoadingPublicMusicbillCollections
                            )
                        }
                    }
                }
            }
            .refreshable {
                await load(page: playerStore.publicMusicbillCollectionPage, force: true)
            }
            .overlay {
                if playerStore.isLoadingPublicMusicbillCollections {
                    ProgressView()
                        .padding(16)
                        .background(.regularMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }
        }
    }

    private var totalPages: Int {
        max(
            1,
            Int(
                ceil(
                    Double(playerStore.publicMusicbillCollectionTotal) /
                        Double(playerStore.publicMusicbillCollectionPageSize)
                )
            )
        )
    }

    private func load(page: Int, force: Bool = false) async {
        await playerStore.loadPublicMusicbillCollections(
            keyword: searchText,
            page: page,
            force: force
        )
        searchText = playerStore.publicMusicbillCollectionKeyword
    }
}

private enum PlayerSearchTab: String, CaseIterable, Identifiable {
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

private struct SearchMusicView: View {
    @ObservedObject var playerStore: PlayerStore

    @Environment(\.dismiss) private var dismiss
    @State private var selectedTab = PlayerSearchTab.music
    @State private var searchText = ""
    @State private var musicForMusicbillSelection: Music?
    @State private var artistForDetail: ArtistSearchItem?
    @State private var publicMusicbillForDetail: PublicMusicbillSearchItem?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("Search Type", selection: $selectedTab) {
                    ForEach(PlayerSearchTab.allCases) { tab in
                        Text(tab.rawValue).tag(tab)
                    }
                }
                .pickerStyle(.segmented)
                .padding()

                content
            }
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
                        .disabled(trimmedSearchText.isEmpty || isSearching)
                        .help("Search")
                    }
                }
        }
        .searchable(text: $searchText, prompt: selectedTab.prompt)
        .onSubmit(of: .search) {
            Task {
                await search(page: 1)
            }
        }
        .onChange(of: selectedTab) { _, _ in
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
    private var content: some View {
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

private struct ArtistSearchRow: View {
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

private enum ArtistMusicRole: String, CaseIterable, Identifiable {
    case performer = "Performed"
    case lyricist = "Lyrics"
    case composer = "Composed"

    var id: String {
        rawValue
    }
}

private struct ArtistDetailView: View {
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

private struct PublicMusicbillSearchRow: View {
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

private struct PublicMusicbillDetailView: View {
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

private struct MusicbillSharedUsersView: View {
    @ObservedObject var playerStore: PlayerStore
    let musicbillID: MusicbillDetail.ID

    @Environment(\.dismiss) private var dismiss
    @State private var isShowingInviteSheet = false
    @State private var userForRemoval: MusicbillUser?
    @State private var userForDetail: UserDetailTarget?
    @State private var isConfirmingLeave = false

    private var detail: MusicbillDetail? {
        playerStore.musicbillDetails[musicbillID]
    }

    private var isUpdating: Bool {
        playerStore.updatingSharedUserMusicbillIDs.contains(musicbillID)
    }

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Shared Users")
                #if os(iOS)
                .navigationBarTitleDisplayMode(.inline)
                #endif
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Done") {
                            dismiss()
                        }
                        .disabled(isUpdating)
                    }

                    ToolbarItem(placement: .primaryAction) {
                        Button {
                            isShowingInviteSheet = true
                        } label: {
                            Image(systemName: "person.badge.plus")
                        }
                        .disabled(detail == nil || isUpdating)
                        .help("Invite User")
                    }
                }
        }
        .sheet(isPresented: $isShowingInviteSheet) {
            InviteSharedUserSheet(
                playerStore: playerStore,
                musicbillID: musicbillID
            )
        }
        .sheet(item: $userForDetail) { target in
            UserProfileView(
                userID: target.id,
                playerStore: playerStore
            )
        }
        .confirmationDialog(
            "Remove Shared User?",
            isPresented: Binding(
                get: { userForRemoval != nil },
                set: { isPresented in
                    if !isPresented {
                        userForRemoval = nil
                    }
                }
            ),
            titleVisibility: .visible
        ) {
            if let userForRemoval {
                Button("Remove", role: .destructive) {
                    Task {
                        let didRemove = await playerStore.removeSharedUser(
                            userID: userForRemoval.id,
                            from: musicbillID
                        )
                        if didRemove {
                            self.userForRemoval = nil
                        }
                    }
                }
            }
            Button("Cancel", role: .cancel) {
                userForRemoval = nil
            }
        } message: {
            if let userForRemoval {
                Text("Remove \(userForRemoval.nickname) from this shared musicbill.")
            }
        }
        .confirmationDialog(
            "Leave Shared Musicbill?",
            isPresented: $isConfirmingLeave,
            titleVisibility: .visible
        ) {
            Button("Leave", role: .destructive) {
                Task {
                    let didLeave = await playerStore.leaveSharedMusicbill(id: musicbillID)
                    if didLeave {
                        dismiss()
                    }
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This musicbill will be removed from your sidebar.")
        }
        .task(id: musicbillID) {
            await playerStore.loadMusicbill(id: musicbillID)
        }
    }

    @ViewBuilder
    private var content: some View {
        if let detail {
            userList(detail)
        } else if playerStore.loadingMusicbillIDs.contains(musicbillID) {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else {
            ContentUnavailableView(
                "Shared Users Not Loaded",
                systemImage: "person.2",
                description: Text("Pull to refresh or try again.")
            )
        }
    }

    private func userList(_ detail: MusicbillDetail) -> some View {
        let isOwner = playerStore.isMusicbillOwner(detail)

        return List {
            Section("Owner") {
                MusicbillSharedUserRow(
                    user: detail.owner,
                    role: .owner,
                    canRemove: false,
                    isUpdating: isUpdating
                ) {
                    userForDetail = UserDetailTarget(id: detail.owner.id)
                } onRemove: {}
            }

            Section("Shared Users") {
                if detail.sharedUserList.isEmpty {
                    ContentUnavailableView(
                        "No Shared Users",
                        systemImage: "person.2.slash",
                        description: Text("Invite a user to share this musicbill.")
                    )
                } else {
                    ForEach(detail.sharedUserList) { sharedUser in
                        MusicbillSharedUserRow(
                            user: sharedUser,
                            role: sharedUser.accepted == false ? .pending : .accepted,
                            canRemove: isOwner,
                            isUpdating: isUpdating
                        ) {
                            userForDetail = UserDetailTarget(id: sharedUser.id)
                        } onRemove: {
                            userForRemoval = sharedUser
                        }
                    }
                }
            }

            if !isOwner {
                Section {
                    Button(role: .destructive) {
                        isConfirmingLeave = true
                    } label: {
                        Label("Leave Shared Musicbill", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                    .disabled(isUpdating)
                }
            }
        }
        .refreshable {
            await playerStore.loadMusicbill(id: detail.id, force: true)
        }
        .overlay {
            if isUpdating {
                ProgressView()
                    .padding(16)
                    .background(.regularMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            }
        }
    }
}

private enum MusicbillSharedUserRole: Equatable {
    case owner
    case accepted
    case pending

    var title: String {
        switch self {
        case .owner:
            return "Owner"
        case .accepted:
            return "Accepted"
        case .pending:
            return "Pending"
        }
    }

    var systemImage: String {
        switch self {
        case .owner:
            return "crown"
        case .accepted:
            return "checkmark.circle"
        case .pending:
            return "clock"
        }
    }
}

private struct MusicbillSharedUserRow: View {
    let user: MusicbillUser
    let role: MusicbillSharedUserRole
    let canRemove: Bool
    let isUpdating: Bool
    let onOpen: () -> Void
    let onRemove: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Button(action: onOpen) {
                HStack(spacing: 12) {
                    ArtworkView(
                        urlString: user.avatar,
                        systemImage: "person.crop.square",
                        size: 44
                    )

                    VStack(alignment: .leading, spacing: 4) {
                        Text(user.nickname)
                            .lineLimit(1)

                        Label(role.title, systemImage: role.systemImage)
                            .font(.footnote)
                            .foregroundStyle(role == .pending ? Color.orange : Color.secondary)
                            .lineLimit(1)
                    }
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            Spacer()

            if canRemove {
                Button(role: .destructive, action: onRemove) {
                    Image(systemName: "trash")
                }
                .disabled(isUpdating)
                .help("Remove User")
            }
        }
        .padding(.vertical, 4)
    }
}

private struct InviteSharedUserSheet: View {
    @ObservedObject var playerStore: PlayerStore
    let musicbillID: MusicbillDetail.ID

    @Environment(\.dismiss) private var dismiss
    @State private var username = ""

    private var trimmedUsername: String {
        username.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var isSaving: Bool {
        playerStore.updatingSharedUserMusicbillIDs.contains(musicbillID)
    }

    private var canSubmit: Bool {
        !trimmedUsername.isEmpty &&
            trimmedUsername.count <= 16 &&
            !isSaving
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Username", text: $username)
                        #if os(iOS)
                        .textInputAutocapitalization(.never)
                        #endif
                        .autocorrectionDisabled()
                        .onChange(of: username) { _, value in
                            username = String(value.trimmingCharacters(in: .whitespacesAndNewlines).prefix(16))
                        }
                        .onSubmit {
                            guard canSubmit else { return }
                            Task {
                                await submit()
                            }
                        }

                    LabeledContent("Characters", value: "\(trimmedUsername.count)/16")
                        .font(.footnote)
                        .foregroundStyle(trimmedUsername.count > 16 ? Color.red : Color.secondary)
                } footer: {
                    Text("The user will receive a shared musicbill invitation.")
                }
            }
            .navigationTitle("Invite User")
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
                            Text("Invite")
                        }
                    }
                    .disabled(!canSubmit)
                }
            }
        }
    }

    private func submit() async {
        let didInvite = await playerStore.inviteSharedUser(
            username: trimmedUsername,
            to: musicbillID
        )
        if didInvite {
            dismiss()
        }
    }
}

private struct MusicbillDetailView: View {
    @ObservedObject var playerStore: PlayerStore
    let musicbillID: MusicbillDetail.ID
    @State private var isShowingRenameSheet = false
    @State private var isShowingSharedUsers = false
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
        .sheet(isPresented: $isShowingSharedUsers) {
            MusicbillSharedUsersView(
                playerStore: playerStore,
                musicbillID: musicbillID
            )
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

            Button {
                isShowingSharedUsers = true
            } label: {
                Label("Shared Users", systemImage: "person.2")
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
    let lyricSnippet: [LyricSearchSnippetLine]
    let lyricKeyword: String
    let onPlay: () -> Void
    let onAddToMusicbill: () -> Void
    var onRemoveFromMusicbill: (() -> Void)? = nil

    init(
        music: Music,
        isCurrent: Bool,
        isPlaying: Bool,
        lyricSnippet: [LyricSearchSnippetLine] = [],
        lyricKeyword: String = "",
        onPlay: @escaping () -> Void,
        onAddToMusicbill: @escaping () -> Void,
        onRemoveFromMusicbill: (() -> Void)? = nil
    ) {
        self.music = music
        self.isCurrent = isCurrent
        self.isPlaying = isPlaying
        self.lyricSnippet = lyricSnippet
        self.lyricKeyword = lyricKeyword
        self.onPlay = onPlay
        self.onAddToMusicbill = onAddToMusicbill
        self.onRemoveFromMusicbill = onRemoveFromMusicbill
    }

    var body: some View {
        Button(action: onPlay) {
            VStack(alignment: .leading, spacing: 8) {
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

                if !lyricSnippet.isEmpty {
                    lyricSnippetView
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

    private var lyricSnippetView: some View {
        VStack(alignment: .leading, spacing: 4) {
            ForEach(lyricSnippet) { line in
                Text(line.text)
                    .font(line.isMatch ? .callout.weight(.semibold) : .footnote)
                    .foregroundStyle(line.isMatch ? Color.accentColor : Color.secondary)
                    .lineLimit(2)
            }
        }
        .padding(.leading, 56)
        .accessibilityLabel("Matched lyrics")
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
    @State private var artistForDetail: ArtistSearchItem?
    @State private var publicMusicbillForDetail: PublicMusicbillSearchItem?
    @State private var userForDetail: UserDetailTarget?

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
        .sheet(item: $userForDetail) { target in
            UserProfileView(
                userID: target.id,
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
        .task(id: audioPlayer.currentMusic?.id) {
            guard let musicID = audioPlayer.currentMusic?.id else {
                return
            }
            await playerStore.loadMusicDetail(id: musicID)
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
        let detail = playerStore.musicDetails[music.id]
        let isLoadingDetail = playerStore.loadingMusicDetailIDs.contains(music.id)

        return VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Details")
                    .font(.headline)

                Spacer()

                if isLoadingDetail {
                    ProgressView()
                        .controlSize(.small)
                }
            }

            VStack(spacing: 10) {
                detailRow("Type", music.type == 2 ? "Instrumental" : "Song")

                if let detail {
                    if let year = detail.year {
                        detailRow("Year", String(year))
                    }

                    if detail.createTimestamp > 0 {
                        detailRow(
                            "Added",
                            formatCicadaTimestamp(
                                detail.createTimestamp,
                                date: .abbreviated,
                                time: .omitted
                            )
                        )
                    }

                    if let assetDurationMs = detail.assetDurationMs {
                        detailRow("Duration", formatPlaybackTime(Double(assetDurationMs) / 1000))
                    }

                    if let assetCodec = detail.assetCodec, !assetCodec.isEmpty {
                        detailRow("Codec", assetCodec.uppercased())
                    }

                    if let assetBitRate = detail.assetBitRate {
                        detailRow("Bit Rate", formatAssetBitRate(assetBitRate))
                    }

                    detailRow("Heat", String(detail.heat))
                    detailRow("Musicbills", String(detail.musicbillCount))
                } else {
                    detailRow("Performers", artistLine(music.performers))

                    if !music.lyricists.isEmpty {
                        detailRow("Lyricists", artistLine(music.lyricists))
                    }

                    if !music.composers.isEmpty {
                        detailRow("Composers", artistLine(music.composers))
                    }
                }
            }

            if let detail {
                artistSection("Performers", artists: detail.performers)
                artistSection("Lyricists", artists: detail.lyricists)
                artistSection("Composers", artists: detail.composers)
                relatedPublicMusicbillSection(detail.relatedPublicMusicbillList)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private func artistSection(_ title: String, artists: [ArtistSearchItem]) -> some View {
        if !artists.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                Text(title)
                    .font(.headline)

                VStack(spacing: 0) {
                    ForEach(Array(artists.enumerated()), id: \.element.id) { index, artist in
                        Button {
                            artistForDetail = artist
                        } label: {
                            MusicDetailArtistRow(artist: artist)
                        }
                        .buttonStyle(.plain)

                        if index < artists.count - 1 {
                            Divider()
                                .padding(.leading, 52)
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func relatedPublicMusicbillSection(_ musicbills: [PublicMusicbillSearchItem]) -> some View {
        if !musicbills.isEmpty {
            let visibleMusicbills = Array(musicbills.prefix(5))

            VStack(alignment: .leading, spacing: 10) {
                Text("Related Musicbills")
                    .font(.headline)

                VStack(spacing: 0) {
                    ForEach(Array(visibleMusicbills.enumerated()), id: \.element.id) { index, musicbill in
                        RelatedPublicMusicbillRow(
                            musicbill: musicbill,
                            onOpen: {
                                publicMusicbillForDetail = musicbill
                            },
                            onOpenUser: {
                                userForDetail = UserDetailTarget(id: musicbill.user.id)
                            }
                        )

                        if index < visibleMusicbills.count - 1 {
                            Divider()
                                .padding(.leading, 52)
                        }
                    }
                }
            }
        }
    }

    private func formatAssetBitRate(_ bitRate: Int) -> String {
        if bitRate >= 1000 {
            return "\(bitRate / 1000) kbps"
        }
        return "\(bitRate) bps"
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

private struct MusicDetailArtistRow: View {
    let artist: ArtistSearchItem

    var body: some View {
        HStack(spacing: 12) {
            ArtworkView(
                urlString: artist.avatar,
                systemImage: "person.crop.square",
                size: 40
            )

            VStack(alignment: .leading, spacing: 3) {
                Text(artist.name)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(1)

                if !artist.aliases.isEmpty {
                    Text(artist.aliases.joined(separator: " / "))
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 8)
        .contentShape(Rectangle())
    }
}

private struct RelatedPublicMusicbillRow: View {
    let musicbill: PublicMusicbillSearchItem
    let onOpen: () -> Void
    let onOpenUser: () -> Void

    var body: some View {
        HStack(spacing: 8) {
            Button(action: onOpen) {
                HStack(spacing: 12) {
                    ArtworkView(
                        urlString: musicbill.cover,
                        systemImage: "music.note.list",
                        size: 40
                    )

                    VStack(alignment: .leading, spacing: 3) {
                        Text(musicbill.name)
                            .font(.subheadline.weight(.semibold))
                            .lineLimit(1)
                        Text(musicbill.user.nickname)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 2) {
                        Text("\(musicbill.musicCount)")
                            .font(.subheadline.monospacedDigit().weight(.semibold))
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

            Button(action: onOpenUser) {
                Image(systemName: "person.crop.circle")
                    .font(.body)
                    .frame(width: 28, height: 28)
            }
            .buttonStyle(.borderless)
            .help("Open Owner")
        }
        .padding(.vertical, 8)
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

private func dateFromCicadaTimestamp(_ timestamp: TimeInterval) -> Date {
    let seconds = timestamp > 10_000_000_000 ? timestamp / 1000 : timestamp
    return Date(timeIntervalSince1970: seconds)
}

private func formatCicadaTimestamp(
    _ timestamp: TimeInterval,
    date: Date.FormatStyle.DateStyle,
    time: Date.FormatStyle.TimeStyle
) -> String {
    dateFromCicadaTimestamp(timestamp).formatted(date: date, time: time)
}

private func displayDeviceName(_ session: AuthSession) -> String {
    let name = session.deviceName.trimmingCharacters(in: .whitespacesAndNewlines)
    return name.isEmpty ? "Unknown Device" : name
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
