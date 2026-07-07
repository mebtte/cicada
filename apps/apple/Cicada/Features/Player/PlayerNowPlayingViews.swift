import Foundation
import SwiftUI

enum NowPlayingLyricState: Equatable {
    case idle
    case loading
    case instrumental
    case empty
    case loaded([LyricItem])
    case failed(String)
}

struct NowPlayingDetailView: View {
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

struct MusicDetailArtistRow: View {
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

struct RelatedPublicMusicbillRow: View {
    let musicbill: PublicMusicbillSearchItem
    let onOpen: () -> Void
    let onOpenUser: () -> Void

    var body: some View {
        HStack(spacing: 8) {
            Button(action: onOpen) {
                HStack(spacing: 12) {
                    ArtworkView(
                        urlString: musicbill.cover,
                        placeholderURLString: musicbill.coverThumbnail,
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

struct QueueView: View {
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

struct QueueRow: View {
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

struct LyricTimelineLine: Identifiable, Equatable {
    let id: String
    let time: Double?
    let texts: [String]
}

struct LyricLinesView: View {
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

struct MiniPlayerView: View {
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

struct ParsedLyricEntry {
    let timeMillis: Int?
    let text: String
    let sourceIndex: Int
    let sequence: Int
}

func parseLyricItems(_ lyrics: [LyricItem]) -> [LyricTimelineLine] {
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

func parseLRC(_ lrc: String, sourceIndex: Int) -> [ParsedLyricEntry] {
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

func lyricTimeMillis(from match: NSTextCheckingResult, in line: NSString) -> Int? {
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

func dateFromCicadaTimestamp(_ timestamp: TimeInterval) -> Date {
    let seconds = timestamp > 10_000_000_000 ? timestamp / 1000 : timestamp
    return Date(timeIntervalSince1970: seconds)
}

func formatCicadaTimestamp(
    _ timestamp: TimeInterval,
    date: Date.FormatStyle.DateStyle,
    time: Date.FormatStyle.TimeStyle
) -> String {
    dateFromCicadaTimestamp(timestamp).formatted(date: date, time: time)
}

func displayDeviceName(_ session: AuthSession) -> String {
    let name = session.deviceName.trimmingCharacters(in: .whitespacesAndNewlines)
    return name.isEmpty ? "Unknown Device" : name
}

func formatPlaybackTime(_ seconds: Double) -> String {
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
