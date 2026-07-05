import Foundation
import SwiftUI

enum MusicbillCaptchaAction: Identifiable, Equatable {
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

struct MusicbillCaptchaActionSheet: View {
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

struct AddToMusicbillSheet: View {
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

struct AddToMusicbillRow: View {
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

struct SharedMusicbillInvitationView: View {
    @ObservedObject var playerStore: PlayerStore
    let showsDoneButton: Bool
    let embedsInNavigationStack: Bool

    @Environment(\.dismiss) private var dismiss
    @State private var userForDetail: UserDetailTarget?

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
        Group {
            if embedsInNavigationStack {
                NavigationStack {
                    pageContent
                }
            } else {
                pageContent
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

    private var pageContent: some View {
        content
            .navigationTitle("Shared Invitations")
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

struct SharedMusicbillInvitationRow: View {
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

struct PublicMusicbillCollectionView: View {
    @ObservedObject var playerStore: PlayerStore
    let showsDoneButton: Bool
    let embedsInNavigationStack: Bool

    @Environment(\.dismiss) private var dismiss
    @State private var searchText = ""
    @State private var musicbillForDetail: PublicMusicbillSearchItem?

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
        Group {
            if embedsInNavigationStack {
                NavigationStack {
                    pageContent
                }
            } else {
                pageContent
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

    private var pageContent: some View {
        content
            .navigationTitle("Public Collections")
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
