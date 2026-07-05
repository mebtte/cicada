import Foundation
import SwiftUI

// MARK: - Exploration

struct ExplorationView: View {
    @ObservedObject var playerStore: PlayerStore

    @Environment(\.dismiss) private var dismiss
    let showsDoneButton: Bool
    let embedsInNavigationStack: Bool

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
    }

    private var pageContent: some View {
        ExplorationContentView(playerStore: playerStore)
            .navigationTitle("Explore")
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
                            await playerStore.loadExploration(force: true)
                        }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(playerStore.isLoadingExploration)
                    .help("Refresh")
                }
            }
    }
}

struct ExplorationContentView: View {
    @ObservedObject var playerStore: PlayerStore

    @State private var artistForDetail: ArtistSearchItem?
    @State private var publicMusicbillForDetail: PublicMusicbillSearchItem?

    var body: some View {
        content
            .task {
                await playerStore.loadExploration()
            }
            .sheet(item: $artistForDetail) { artist in
                ArtistDetailView(artist: artist, playerStore: playerStore)
            }
            .sheet(item: $publicMusicbillForDetail) { musicbill in
                PublicMusicbillDetailView(musicbill: musicbill, playerStore: playerStore)
            }
        }

    @ViewBuilder
    private var content: some View {
        if playerStore.isLoadingExploration && playerStore.exploration == nil {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if let exploration = playerStore.exploration, !exploration.isEmpty {
            List {
                musicSection("For You", items: exploration.musicList)
                artistSection("Artists", items: exploration.artistList)
                musicbillSection("Public Musicbills", items: exploration.publicMusicbillList)
                musicSection("Recently Added", items: exploration.recentMusicList)
                artistSection("Recent Artists", items: exploration.recentArtistList)
                musicbillSection("Recent Musicbills", items: exploration.recentPublicMusicbillList)
            }
            .overlay {
                if playerStore.isLoadingExploration {
                    ProgressView()
                        .padding(16)
                        .background(.regularMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }
        } else if playerStore.exploration != nil {
            ContentUnavailableView(
                "Nothing to Explore",
                systemImage: "sparkles",
                description: Text("Check back later for new picks.")
            )
        } else {
            ContentUnavailableView(
                "Explore",
                systemImage: "sparkles",
                description: Text("Discover music, artists, and public musicbills.")
            )
        }
    }

    @ViewBuilder
    private func musicSection(_ title: String, items: [ExplorationMusicItem]) -> some View {
        if !items.isEmpty {
            Section(title) {
                ForEach(items) { music in
                    ExplorationMusicRow(
                        music: music,
                        isCurrent: playerStore.audioPlayer.currentMusic?.id == music.id,
                        isPlaying: playerStore.audioPlayer.currentMusic?.id == music.id && playerStore.audioPlayer.isPlaying
                    ) {
                        Task {
                            await playerStore.playMusic(id: music.id)
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func artistSection(_ title: String, items: [ExplorationArtistItem]) -> some View {
        if !items.isEmpty {
            Section(title) {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 14) {
                        ForEach(items) { artist in
                            ExplorationArtistCard(artist: artist) {
                                artistForDetail = artist.asSearchItem()
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }
                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
            }
        }
    }

    @ViewBuilder
    private func musicbillSection(_ title: String, items: [ExplorationPublicMusicbillItem]) -> some View {
        if !items.isEmpty {
            Section(title) {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 14) {
                        ForEach(items) { musicbill in
                            ExplorationMusicbillCard(musicbill: musicbill) {
                                publicMusicbillForDetail = musicbill.asSearchItem()
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }
                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
            }
        }
    }
}

struct ExplorationMusicRow: View {
    let music: ExplorationMusicItem
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

struct ExplorationArtistCard: View {
    let artist: ExplorationArtistItem
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 8) {
                ArtworkView(
                    urlString: artist.photos.first?.thumbnail?.isEmpty == false ? artist.photos.first?.thumbnail : artist.avatar,
                    systemImage: "music.mic",
                    size: 96
                )
                .clipShape(Circle())

                Text(artist.name)
                    .font(.footnote)
                    .lineLimit(1)
                    .frame(width: 96)
            }
        }
        .buttonStyle(.plain)
    }
}

struct ExplorationMusicbillCard: View {
    let musicbill: ExplorationPublicMusicbillItem
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                ArtworkView(
                    urlString: musicbill.cover,
                    systemImage: "music.note.list",
                    size: 120
                )

                Text(musicbill.name)
                    .font(.footnote)
                    .lineLimit(1)
                Text(musicbill.user.nickname)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            .frame(width: 120, alignment: .leading)
        }
        .buttonStyle(.plain)
    }
}
