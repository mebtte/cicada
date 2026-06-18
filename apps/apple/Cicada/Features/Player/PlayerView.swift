import Foundation
import SwiftUI

struct PlayerView: View {
    @ObservedObject var serverStore: ServerSetupStore
    @StateObject private var playerStore = PlayerStore()

    var body: some View {
        if let server = serverStore.selectedServer,
           let user = serverStore.selectedUser {
            NavigationSplitView {
                sidebar(server: server, user: user)
            } detail: {
                detail
            }
            .safeAreaInset(edge: .bottom) {
                MiniPlayerView(audioPlayer: playerStore.audioPlayer)
            }
            .task(id: authKey(server: server, user: user)) {
                playerStore.configure(server: server, user: user)
                await playerStore.loadMusicbillList()
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
            if playerStore.isLoadingMusicbillList && playerStore.musicbills.isEmpty {
                ProgressView()
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
            ToolbarItem(placement: .primaryAction) {
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

private struct MusicbillDetailView: View {
    @ObservedObject var playerStore: PlayerStore
    let musicbillID: MusicbillDetail.ID

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
        .task(id: musicbillID) {
            await playerStore.loadMusicbill(id: musicbillID)
        }
        .refreshable {
            await playerStore.loadMusicbill(id: musicbillID, force: true)
        }
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
    }
}

private struct MiniPlayerView: View {
    @ObservedObject var audioPlayer: AudioPlayerController

    var body: some View {
        if let music = audioPlayer.currentMusic {
            VStack(spacing: 8) {
                Divider()
                HStack(spacing: 12) {
                    ArtworkView(
                        urlString: music.coverThumbnail?.isEmpty == false ? music.coverThumbnail : music.cover,
                        systemImage: "music.note",
                        size: 44
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

                    Spacer()

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

                if audioPlayer.duration > 0 {
                    HStack(spacing: 10) {
                        Text(formatTime(audioPlayer.currentTime))
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

                        Text(formatTime(audioPlayer.duration))
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

    private func formatTime(_ seconds: Double) -> String {
        guard seconds.isFinite else { return "0:00" }
        let totalSeconds = max(0, Int(seconds.rounded()))
        let minutes = totalSeconds / 60
        let remainingSeconds = totalSeconds % 60
        return "\(minutes):\(String(format: "%02d", remainingSeconds))"
    }
}
