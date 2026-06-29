import SwiftUI

struct OfflineCacheView: View {
    @ObservedObject var playerStore: PlayerStore
    @ObservedObject var manager: OfflineCacheManager

    @State private var searchText = ""
    @State private var isShowingClearConfirmation = false

    var body: some View {
        List {
            Section {
                LabeledContent("Used", value: formattedBytes(manager.totalBytes))

                Button(role: .destructive) {
                    isShowingClearConfirmation = true
                } label: {
                    Label("Clear All", systemImage: "trash")
                }
                .disabled(manager.items.isEmpty)
            }

            if !filteredItems.isEmpty {
                Section("\(filteredItems.count) Songs") {
                    ForEach(filteredItems) { item in
                        OfflineCacheRow(
                            item: item,
                            isCurrent: playerStore.audioPlayer.currentMusic?.id == item.musicID,
                            isPlaying: playerStore.audioPlayer.currentMusic?.id == item.musicID && playerStore.audioPlayer.isPlaying
                        ) {
                            play(item)
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            Button(role: .destructive) {
                                manager.remove(id: item.id)
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Offline Cache")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .searchable(text: $searchText, prompt: "Search cached songs")
        .overlay {
            if manager.items.isEmpty {
                ContentUnavailableView(
                    "No Offline Songs",
                    systemImage: "arrow.down.circle",
                    description: Text("Songs you play or save are cached here for offline listening.")
                )
            } else if filteredItems.isEmpty {
                ContentUnavailableView.search(text: searchText)
            }
        }
        .confirmationDialog(
            "Remove all offline songs?",
            isPresented: $isShowingClearConfirmation,
            titleVisibility: .visible
        ) {
            Button("Clear All", role: .destructive) {
                manager.clearAll()
            }
            Button("Cancel", role: .cancel) {}
        }
    }

    private var filteredItems: [OfflineMusic] {
        let keyword = searchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !keyword.isEmpty else { return manager.items }
        return manager.items.filter { item in
            if item.name.lowercased().contains(keyword) { return true }
            if item.aliases.contains(where: { $0.lowercased().contains(keyword) }) { return true }
            return item.performers.contains { $0.name.lowercased().contains(keyword) }
        }
    }

    private func play(_ item: OfflineMusic) {
        playerStore.play(music: item.asMusic(), in: filteredItems.map { $0.asMusic() })
    }

    private func formattedBytes(_ bytes: Int64) -> String {
        ByteCountFormatter.string(fromByteCount: bytes, countStyle: .file)
    }
}

private struct OfflineCacheRow: View {
    let item: OfflineMusic
    let isCurrent: Bool
    let isPlaying: Bool
    let onPlay: () -> Void

    var body: some View {
        Button(action: onPlay) {
            HStack(spacing: 12) {
                ArtworkView(
                    urlString: item.coverThumbnail?.isEmpty == false ? item.coverThumbnail : item.cover,
                    systemImage: "music.note",
                    size: 44
                )

                VStack(alignment: .leading, spacing: 3) {
                    Text(item.name)
                        .lineLimit(1)
                    Text(item.performerLine)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                Spacer()

                Text(item.quality.uppercased())
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.cicadaSecondaryBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))

                if isCurrent {
                    Image(systemName: isPlaying ? "speaker.wave.2.fill" : "pause.circle")
                        .foregroundStyle(.tint)
                }
            }
        }
        .buttonStyle(.plain)
    }
}
