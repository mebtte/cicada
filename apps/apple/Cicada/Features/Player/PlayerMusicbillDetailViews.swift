import Foundation
import SwiftUI

struct MusicbillSharedUsersView: View {
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

enum MusicbillSharedUserRole: Equatable {
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

struct MusicbillSharedUserRow: View {
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

struct InviteSharedUserSheet: View {
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

struct MusicbillDetailView: View {
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
                        } onSaveOffline: {
                            playerStore.saveOffline(music)
                        }
                    }
                }
            }
        }
    }
}

struct MusicRow: View {
    let music: Music
    let isCurrent: Bool
    let isPlaying: Bool
    let lyricSnippet: [LyricSearchSnippetLine]
    let lyricKeyword: String
    let onPlay: () -> Void
    let onAddToMusicbill: () -> Void
    var onRemoveFromMusicbill: (() -> Void)? = nil
    var onSaveOffline: (() -> Void)? = nil

    init(
        music: Music,
        isCurrent: Bool,
        isPlaying: Bool,
        lyricSnippet: [LyricSearchSnippetLine] = [],
        lyricKeyword: String = "",
        onPlay: @escaping () -> Void,
        onAddToMusicbill: @escaping () -> Void,
        onRemoveFromMusicbill: (() -> Void)? = nil,
        onSaveOffline: (() -> Void)? = nil
    ) {
        self.music = music
        self.isCurrent = isCurrent
        self.isPlaying = isPlaying
        self.lyricSnippet = lyricSnippet
        self.lyricKeyword = lyricKeyword
        self.onPlay = onPlay
        self.onAddToMusicbill = onAddToMusicbill
        self.onRemoveFromMusicbill = onRemoveFromMusicbill
        self.onSaveOffline = onSaveOffline
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

            if let onSaveOffline {
                Button(action: onSaveOffline) {
                    Label("Save for Offline", systemImage: "arrow.down.circle")
                }
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
