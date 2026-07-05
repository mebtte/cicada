import Foundation
import SwiftUI

struct PlayerView: View {
    @ObservedObject var serverStore: ServerSetupStore
    @EnvironmentObject private var navigationStore: AppNavigationStore
    @StateObject private var playerStore = PlayerStore()
    @State private var selectedContent: PlayerContentSelection? = .exploreSearch
    @State private var isShowingCreateMusicbill = false
    @State private var isShowingNowPlaying = false
    @State private var isShowingQueue = false
    @State private var isShowingMacSidebarOverlay = false
    @StateObject private var settings = AppSettingsStore.shared

    var body: some View {
        if let server = serverStore.selectedServer,
           let user = serverStore.selectedUser {
            playerLayout(server: server, user: user)
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
            .task(id: authKey(server: server, user: user)) {
                selectedContent = .exploreSearch
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
            .onChange(of: playerStore.selectedMusicbillID) { _, _ in
                isShowingMacSidebarOverlay = false
            }
            .onChange(of: selectedContent) { _, selection in
                syncSelectedContent(selection)
            }
            .onChange(of: navigationStore.playerContentRequest) { _, request in
                guard let request else { return }
                // App menu commands route into the same content selection used by the sidebar.
                selectedContent = request.selection
                navigationStore.consume(request)
            }
        } else {
            ContentUnavailableView(
                "No User Selected",
                systemImage: "person.crop.circle.badge.exclamationmark",
                description: Text("Sign in before opening the player.")
            )
        }
    }

    @ViewBuilder
    private func playerLayout(server: ServerRecord, user: ServerUserRecord) -> some View {
        #if os(macOS)
        MacPlayerLayout(isSidebarPresented: $isShowingMacSidebarOverlay) {
            sidebar(server: server, user: user)
        } detail: {
            detail
        }
        #else
        NavigationSplitView {
            sidebar(server: server, user: user)
        } detail: {
            detail
        }
        .navigationSplitViewStyle(.prominentDetail)
        #endif
    }

    private func sidebar(server: ServerRecord, user: ServerUserRecord) -> some View {
        PlayerSidebar(
            server: server,
            user: user,
            versionWarning: serverStore.selectedServerVersionWarning,
            metadataError: serverStore.selectedServerMetadataError,
            isRefreshingMetadata: serverStore.isRefreshingSelectedServerMetadata,
            isLoadingMusicbillList: playerStore.isLoadingMusicbillList,
            musicbills: playerStore.musicbills,
            selectedContent: $selectedContent,
            onCreateMusicbill: {
                isShowingMacSidebarOverlay = false
                isShowingCreateMusicbill = true
            },
            onRefreshMusicbills: {
                await playerStore.loadMusicbillList()
            },
            onRetryServerCheck: {
                Task {
                    await serverStore.refreshSelectedServerMetadata()
                }
            },
            onSwitchAccount: {
                isShowingMacSidebarOverlay = false
                playerStore.audioPlayer.stop()
                serverStore.clearSelectedUser()
            },
            onChangeServer: {
                isShowingMacSidebarOverlay = false
                playerStore.audioPlayer.stop()
                serverStore.showServerSetup()
            },
            onSignOut: {
                isShowingMacSidebarOverlay = false
                Task {
                    await playerStore.deleteCurrentSession()
                    playerStore.audioPlayer.stop()
                    serverStore.removeSelectedUser()
                }
            }
        )
    }

    @ViewBuilder
    private var detail: some View {
        detailContent
            .safeAreaInset(edge: .bottom) {
                MiniPlayerView(audioPlayer: playerStore.audioPlayer) {
                    isShowingNowPlaying = true
                } onQueue: {
                    isShowingQueue = true
                }
            }
    }

    @ViewBuilder
    private var detailContent: some View {
        switch selectedContent ?? .exploreSearch {
        case .exploreSearch:
            SearchMusicView(
                playerStore: playerStore,
                showsDoneButton: false,
                embedsInNavigationStack: false
            )
        case .settings:
            SettingsView(
                settings: settings,
                playerStore: playerStore,
                offlineCacheManager: playerStore.offlineCacheManager,
                showsDoneButton: false,
                embedsInNavigationStack: false
            )
        case .profile:
            AccountProfileView(
                playerStore: playerStore,
                serverStore: serverStore,
                showsDoneButton: false,
                embedsInNavigationStack: false
            )
        case .sharedInvitations:
            SharedMusicbillInvitationView(
                playerStore: playerStore,
                showsDoneButton: false,
                embedsInNavigationStack: false
            )
        case .publicCollections:
            PublicMusicbillCollectionView(
                playerStore: playerStore,
                showsDoneButton: false,
                embedsInNavigationStack: false
            )
        case .musicbill(let selectedMusicbillID):
            MusicbillDetailView(
                playerStore: playerStore,
                musicbillID: selectedMusicbillID
            )
        }
    }

    private func syncSelectedContent(_ selection: PlayerContentSelection?) {
        // Sidebar selections must keep the shared player store in sync because
        // detail loading and playback actions still key off the selected musicbill.
        if case .musicbill(let id) = selection {
            playerStore.selectedMusicbillID = id
        }
        isShowingMacSidebarOverlay = false
    }

    private func authKey(server: ServerRecord, user: ServerUserRecord) -> String {
        "\(server.origin)|\(user.id)|\(user.token)"
    }
}
