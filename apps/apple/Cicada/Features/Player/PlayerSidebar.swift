import Foundation
import SwiftUI

enum PlayerContentSelection: Hashable {
    case exploreSearch
    case settings
    case profile
    case sharedInvitations
    case publicCollections
    case musicbill(MusicbillSummary.ID)
}

struct PlayerSidebar: View {
    let server: ServerRecord
    let user: ServerUserRecord
    let versionWarning: String?
    let metadataError: String?
    let isRefreshingMetadata: Bool
    let isLoadingMusicbillList: Bool
    let musicbills: [MusicbillSummary]
    @Binding var selectedContent: PlayerContentSelection?
    let onCreateMusicbill: () -> Void
    let onRefreshMusicbills: () async -> Void
    let onRetryServerCheck: () -> Void
    let onSwitchAccount: () -> Void
    let onChangeServer: () -> Void
    let onSignOut: () -> Void

    var body: some View {
        List(selection: $selectedContent) {
            #if !os(macOS)
            Section {
                accountRow
            }
            #endif

            serverStatusSection

            Section("Browse") {
                SidebarSettingsLabel(
                    title: "Explore",
                    systemImage: "magnifyingglass",
                    tint: .primary
                )
                .tag(PlayerContentSelection.exploreSearch)
                .help("Explore")

                SidebarSettingsLabel(
                    title: "Settings",
                    systemImage: "gearshape",
                    tint: .primary
                )
                .tag(PlayerContentSelection.settings)
                .help("Settings")
            }

            Section {
                MusicbillActionRow(
                    isRefreshing: isLoadingMusicbillList,
                    onCreate: onCreateMusicbill,
                    onRefresh: {
                        Task {
                            await onRefreshMusicbills()
                        }
                    }
                )

                SidebarSettingsLabel(
                    title: "Shared Invitations",
                    systemImage: "person.2",
                    tint: .primary
                )
                .tag(PlayerContentSelection.sharedInvitations)
                .help("Shared Invitations")

                SidebarSettingsLabel(
                    title: "Public Collections",
                    systemImage: "star",
                    tint: .primary
                )
                .tag(PlayerContentSelection.publicCollections)
                .help("Public Collections")

                if isLoadingMusicbillList && musicbills.isEmpty {
                    ProgressView("Loading musicbills")
                } else if musicbills.isEmpty {
                    SidebarSettingsLabel(
                        title: "No musicbills",
                        systemImage: "music.note.list",
                        tint: .secondary
                    )
                }

                ForEach(musicbills) { musicbill in
                    MusicbillSidebarRow(musicbill: musicbill)
                        .tag(PlayerContentSelection.musicbill(musicbill.id))
                }
            } header: {
                Text("Musicbills")
            }
        }
        .navigationTitle("Cicada")
        .listStyle(.sidebar)
        #if os(macOS)
        .scrollContentBackground(.hidden)
        .background(.clear)
        .safeAreaInset(edge: .top) {
            Color.clear.frame(height: 48)
        }
        .safeAreaInset(edge: .bottom) {
            accountFooter
        }
        #endif
        .refreshable {
            await onRefreshMusicbills()
        }
    }

    private var accountRow: some View {
        HStack(spacing: 10) {
            SidebarAccountSummary(server: server, user: user)

            Spacer(minLength: 0)

            accountMenu
                .labelStyle(.iconOnly)
        }
        .tag(PlayerContentSelection.profile)
        .help(server.hostname)
    }

    #if os(macOS)
    private var accountFooter: some View {
        HStack(spacing: 8) {
            Button {
                selectedContent = .profile
            } label: {
                SidebarAccountSummary(server: server, user: user)
            }
            .buttonStyle(.plain)

            Spacer(minLength: 0)

            accountMenu
                .labelStyle(.iconOnly)
                .menuStyle(.borderlessButton)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 9)
        .background {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(selectedContent == .profile ? Color.accentColor.opacity(0.14) : Color.clear)
        }
        .padding(.horizontal, 8)
        .padding(.bottom, 8)
    }
    #endif

    @ViewBuilder
    private var serverStatusSection: some View {
        if versionWarning != nil || metadataError != nil {
            Section("Server") {
                if let versionWarning {
                    SidebarSettingsLabel(
                        title: versionWarning,
                        systemImage: "exclamationmark.triangle",
                        tint: .orange
                    )
                }

                if let metadataError {
                    SidebarSettingsLabel(
                        title: metadataError,
                        systemImage: "wifi.exclamationmark",
                        tint: .secondary
                    )

                    Button {
                        onRetryServerCheck()
                    } label: {
                        SidebarSettingsLabel(
                            title: "Retry Server Check",
                            systemImage: "arrow.clockwise",
                            tint: .blue
                        )
                    }
                    .buttonStyle(.plain)
                    .disabled(isRefreshingMetadata)
                }
            }
        }
    }

    private var accountMenu: some View {
        Menu {
            Button {
                selectedContent = .profile
            } label: {
                Label("Profile", systemImage: "person.crop.circle")
            }

            Button {
                selectedContent = .settings
            } label: {
                Label("Settings", systemImage: "gearshape")
            }

            Divider()

            Button(action: onSwitchAccount) {
                Label("Switch Account", systemImage: "person.2")
            }

            Button(action: onChangeServer) {
                Label("Change Server", systemImage: "network")
            }

            Button(role: .destructive, action: onSignOut) {
                Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
            }
        } label: {
            Label("Account", systemImage: "ellipsis.circle")
        }
        .help("Account")
    }
}

struct SidebarAccountSummary: View {
    let server: ServerRecord
    let user: ServerUserRecord

    var body: some View {
        HStack(spacing: 10) {
            ArtworkView(
                urlString: user.avatar,
                systemImage: "person.crop.square",
                size: 36
            )

            VStack(alignment: .leading, spacing: 2) {
                Text(user.nickname)
                    .font(.headline)
                    .lineLimit(1)

                Text(server.hostname)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
        .contentShape(Rectangle())
    }
}

struct SidebarSettingsLabel: View {
    let title: String
    let systemImage: String
    let tint: Color

    var body: some View {
        HStack(spacing: 9) {
            SidebarSettingsIcon(systemImage: systemImage, tint: tint)

            Text(title)
                #if os(macOS)
                .font(.system(size: 16, weight: .medium))
                #endif
                .lineLimit(1)

            Spacer(minLength: 0)
        }
        #if os(macOS)
        .padding(.vertical, 4)
        #endif
        .contentShape(Rectangle())
    }
}

struct SidebarSettingsIcon: View {
    let systemImage: String
    let tint: Color

    var body: some View {
        Image(systemName: systemImage)
            #if os(macOS)
            .font(.system(size: 21, weight: .regular))
            .frame(width: 28, height: 28)
            #else
            .font(.system(size: 13, weight: .semibold))
            .frame(width: 24, height: 24)
            #endif
            .foregroundStyle(tint)
    }
}

struct MusicbillActionRow: View {
    let isRefreshing: Bool
    let onCreate: () -> Void
    let onRefresh: () -> Void

    var body: some View {
        HStack {
            Button(action: onCreate) {
                Label("New Musicbill", systemImage: "plus")
            }
            .labelStyle(.iconOnly)
            .help("New Musicbill")

            Button(action: onRefresh) {
                if isRefreshing {
                    ProgressView()
                } else {
                    Label("Reload Musicbill List", systemImage: "arrow.clockwise")
                }
            }
            .disabled(isRefreshing)
            .labelStyle(.iconOnly)
            .help("Reload Musicbill List")

            Spacer()
        }
        .buttonStyle(.borderless)
    }
}

struct MusicbillSidebarRow: View {
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
