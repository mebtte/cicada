import Foundation
import SwiftUI

struct UserDetailTarget: Identifiable {
    let id: String
}

struct AccountProfileView: View {
    @ObservedObject var playerStore: PlayerStore
    @ObservedObject var serverStore: ServerSetupStore
    let showsDoneButton: Bool
    let embedsInNavigationStack: Bool

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

    init(
        playerStore: PlayerStore,
        serverStore: ServerSetupStore,
        showsDoneButton: Bool = true,
        embedsInNavigationStack: Bool = true
    ) {
        self.playerStore = playerStore
        self.serverStore = serverStore
        self.showsDoneButton = showsDoneButton
        self.embedsInNavigationStack = embedsInNavigationStack
    }

    var body: some View {
        Group {
            if embedsInNavigationStack {
                NavigationStack {
                    pageContent
                }
            } else {
                pageContent
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

    private var pageContent: some View {
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
            if showsDoneButton {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
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

struct ChangePasswordSheet: View {
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

struct AuthorizedDevicesView: View {
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

struct AuthSessionRow: View {
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

struct RenameDeviceSheet: View {
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

struct UserProfileView: View {
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

struct UserPublicMusicbillRow: View {
    let musicbill: UserPublicMusicbill
    let onOpen: () -> Void

    var body: some View {
        Button(action: onOpen) {
            HStack(spacing: 12) {
                ArtworkView(
                    urlString: musicbill.cover,
                    placeholderURLString: musicbill.coverThumbnail,
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
