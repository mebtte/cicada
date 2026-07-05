@preconcurrency import AVFoundation
import Foundation
#if canImport(MediaPlayer)
import MediaPlayer
#endif
#if canImport(MediaPlayer) && os(iOS)
import UIKit
private typealias SystemArtworkImage = UIImage
#endif

@MainActor
final class AudioPlayerController: ObservableObject {
    @Published private(set) var currentMusic: Music?
    @Published private(set) var queue: [Music] = []
    @Published private(set) var currentQueueIndex = -1
    @Published var currentTime: Double = 0
    @Published private(set) var duration: Double = 0
    @Published private(set) var isPlaying = false
    @Published private(set) var isRadioMode = false
    @Published var errorMessage: String?

    /// Called whenever radio playback advances to a new track so the owner can
    /// prefetch additional random songs to keep the queue populated.
    var onRadioAdvance: (() -> Void)?

    /// Resolves a local cached file URL for a track, if one exists. When set and
    /// returning non-nil, playback uses the local file instead of streaming.
    var localAssetURLProvider: ((Music) -> URL?)?

    /// Called once per track when playback passes the offline-cache threshold,
    /// so the owner can cache the asset for offline use.
    var onCacheEligible: ((Music) -> Void)?

    private let player = AVPlayer()
    private var timeObserver: Any?
    private var endObserver: NSObjectProtocol?
    private var client: CicadaAPIClient?
    private var activeRecord: ActivePlaybackRecord?
    private var pendingRadioAutoplay = false
    #if canImport(MediaPlayer) && os(iOS)
    private var systemArtworkTask: Task<Void, Never>?
    #endif

    init() {
        configureAudioSession()
        configureSystemMediaRemoteCommands()
        installTimeObserver()
    }

    deinit {
        MainActor.assumeIsolated {
            if let timeObserver {
                player.removeTimeObserver(timeObserver)
            }
            if let endObserver {
                NotificationCenter.default.removeObserver(endObserver)
            }
            #if canImport(MediaPlayer) && os(iOS)
            systemArtworkTask?.cancel()
            #endif
            #if canImport(MediaPlayer)
            removeSystemMediaRemoteCommands()
            clearSystemNowPlayingInfo()
            #endif
        }
    }

    func configure(client: CicadaAPIClient) {
        self.client = client
    }

    func play(music: Music, in playlist: [Music]) {
        guard let client else {
            errorMessage = "Sign in before playing music."
            return
        }
        self.client = client
        exitRadioMode()
        queue = playlist.isEmpty ? [music] : playlist
        let nextIndex = queue.firstIndex(where: { $0.id == music.id }) ?? 0
        playAt(index: nextIndex, uploadCurrent: true)
    }

    /// Start a fresh radio session seeded with a single random track. Additional
    /// tracks are appended via `appendMusic(_:)` as `onRadioAdvance` requests them.
    func startRadio(initial music: Music) {
        guard let client else {
            errorMessage = "Sign in before playing music."
            return
        }
        self.client = client
        uploadActiveRecord()
        isRadioMode = true
        pendingRadioAutoplay = false
        queue = [music]
        playAt(index: 0, uploadCurrent: false)
    }

    /// Append a track to the queue. In radio mode, resumes playback if it was
    /// waiting for the next prefetched song.
    func appendMusic(_ music: Music) {
        queue.append(music)
        if pendingRadioAutoplay, currentQueueIndex + 1 < queue.count {
            pendingRadioAutoplay = false
            playAt(index: currentQueueIndex + 1, uploadCurrent: false)
        }
    }

    func playQueueItem(at index: Int) {
        playAt(index: index, uploadCurrent: true)
    }

    func togglePlayback() {
        if isPlaying {
            pause()
        } else {
            resume()
        }
    }

    func pause() {
        player.pause()
        isPlaying = false
        uploadActiveRecord()
        updateSystemNowPlayingInfo()
    }

    func resume() {
        guard currentMusic != nil else { return }
        player.play()
        isPlaying = true
        updateSystemNowPlayingInfo()
    }

    func next() {
        guard !queue.isEmpty else { return }
        if isRadioMode {
            if currentQueueIndex + 1 < queue.count {
                playAt(index: currentQueueIndex + 1, uploadCurrent: true)
            } else {
                pendingRadioAutoplay = true
                onRadioAdvance?()
            }
            return
        }
        let nextIndex = currentQueueIndex + 1 < queue.count ? currentQueueIndex + 1 : 0
        playAt(index: nextIndex, uploadCurrent: true)
    }

    func previous() {
        guard !queue.isEmpty else { return }
        if currentTime > 3 {
            seek(to: 0)
            return
        }
        if isRadioMode {
            if currentQueueIndex > 0 {
                playAt(index: currentQueueIndex - 1, uploadCurrent: true)
            } else {
                seek(to: 0)
            }
            return
        }
        let nextIndex = currentQueueIndex > 0 ? currentQueueIndex - 1 : queue.count - 1
        playAt(index: nextIndex, uploadCurrent: true)
    }

    func seek(to seconds: Double) {
        let clampedSeconds = max(0, min(seconds, duration))
        activeRecord?.lastCurrentTime = clampedSeconds
        player.seek(
            to: CMTime(seconds: clampedSeconds, preferredTimescale: 600),
            toleranceBefore: .zero,
            toleranceAfter: .zero
        )
        currentTime = clampedSeconds
        updateSystemNowPlayingInfo()
    }

    func stop() {
        uploadActiveRecord()
        player.pause()
        player.replaceCurrentItem(with: nil)
        removeEndObserver()
        queue = []
        currentQueueIndex = -1
        currentMusic = nil
        currentTime = 0
        duration = 0
        isPlaying = false
        activeRecord = nil
        exitRadioMode()
        clearSystemNowPlayingInfo()
    }

    private func exitRadioMode() {
        isRadioMode = false
        pendingRadioAutoplay = false
        onRadioAdvance = nil
    }

    private func playAt(index: Int, uploadCurrent: Bool) {
        guard queue.indices.contains(index) else { return }
        if uploadCurrent {
            uploadActiveRecord()
        }

        let music = queue[index]
        guard let url = localAssetURLProvider?(music) ?? client?.musicPlaybackURL(for: music) else {
            errorMessage = "This music asset URL is invalid."
            return
        }

        let item = AVPlayerItem(url: url)
        player.replaceCurrentItem(with: item)
        installEndObserver(for: item)

        currentQueueIndex = index
        currentMusic = music
        currentTime = 0
        duration = 0
        activeRecord = ActivePlaybackRecord(musicID: music.id)

        player.play()
        isPlaying = true
        updateSystemNowPlayingInfo(loadArtwork: true)

        if isRadioMode {
            onRadioAdvance?()
        }
    }

    private func installTimeObserver() {
        let interval = CMTime(seconds: 1, preferredTimescale: 600)
        timeObserver = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            Task { @MainActor in
                self?.updatePlaybackTime(time)
            }
        }
    }

    private func installEndObserver(for item: AVPlayerItem) {
        removeEndObserver()
        endObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: item,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.handlePlaybackEnded()
            }
        }
    }

    private func removeEndObserver() {
        if let endObserver {
            NotificationCenter.default.removeObserver(endObserver)
            self.endObserver = nil
        }
    }

    private func updatePlaybackTime(_ time: CMTime) {
        let seconds = time.seconds
        if seconds.isFinite {
            currentTime = seconds
        }

        let itemDuration = player.currentItem?.duration.seconds ?? 0
        if itemDuration.isFinite && itemDuration > 0 {
            duration = itemDuration
        }

        syncActiveRecord()
        updateSystemNowPlayingInfo()
    }

    private func handlePlaybackEnded() {
        if duration > 0 {
            currentTime = duration
        }
        activeRecord?.maxPercent = 1
        uploadActiveRecord()

        if currentQueueIndex + 1 < queue.count {
            playAt(index: currentQueueIndex + 1, uploadCurrent: false)
        } else if isRadioMode {
            pendingRadioAutoplay = true
            isPlaying = false
            onRadioAdvance?()
        } else {
            isPlaying = false
        }
        updateSystemNowPlayingInfo()
    }

    private func syncActiveRecord() {
        guard var record = activeRecord else { return }

        if let lastCurrentTime = record.lastCurrentTime {
            let delta = currentTime - lastCurrentTime
            if isPlaying && delta > 0 && delta <= 30 {
                record.playedSeconds += delta
            }
        }
        record.lastCurrentTime = currentTime

        if duration > 0 {
            record.maxPercent = min(max(record.maxPercent, record.playedSeconds / duration), 1)
        }

        if !record.cacheTriggered, record.maxPercent >= 0.75, let music = currentMusic, music.id == record.musicID {
            record.cacheTriggered = true
            onCacheEligible?(music)
        }

        activeRecord = record
    }

    private func uploadActiveRecord() {
        syncActiveRecord()
        guard
            let client,
            let activeRecord
        else {
            return
        }

        let payload = CreateMusicPlayRecordPayload(
            musicId: activeRecord.musicID,
            clientRecordId: activeRecord.clientRecordID,
            percent: bucketPercent(activeRecord.maxPercent),
            playedAt: Int64(Date().timeIntervalSince1970 * 1000)
        )

        Task {
            try? await client.createMusicPlayRecord(payload)
        }
    }

    private func bucketPercent(_ percent: Double) -> Double {
        let clamped = min(max(percent, 0), 1)
        return (clamped * 20).rounded() / 20
    }

    #if canImport(MediaPlayer)
    private func configureSystemMediaRemoteCommands() {
        let commandCenter = MPRemoteCommandCenter.shared()

        commandCenter.playCommand.addTarget { [weak self] _ in
            Task { @MainActor in
                self?.resume()
            }
            return .success
        }

        commandCenter.pauseCommand.addTarget { [weak self] _ in
            Task { @MainActor in
                self?.pause()
            }
            return .success
        }

        commandCenter.togglePlayPauseCommand.addTarget { [weak self] _ in
            Task { @MainActor in
                self?.togglePlayback()
            }
            return .success
        }

        commandCenter.nextTrackCommand.addTarget { [weak self] _ in
            Task { @MainActor in
                self?.next()
            }
            return .success
        }

        commandCenter.previousTrackCommand.addTarget { [weak self] _ in
            Task { @MainActor in
                self?.previous()
            }
            return .success
        }

        commandCenter.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let event = event as? MPChangePlaybackPositionCommandEvent else {
                return .commandFailed
            }

            Task { @MainActor in
                self?.seek(to: event.positionTime)
            }
            return .success
        }

        commandCenter.stopCommand.isEnabled = false
        updateSystemCommandAvailability()
    }

    private func removeSystemMediaRemoteCommands() {
        let commandCenter = MPRemoteCommandCenter.shared()
        commandCenter.playCommand.removeTarget(nil)
        commandCenter.pauseCommand.removeTarget(nil)
        commandCenter.togglePlayPauseCommand.removeTarget(nil)
        commandCenter.nextTrackCommand.removeTarget(nil)
        commandCenter.previousTrackCommand.removeTarget(nil)
        commandCenter.changePlaybackPositionCommand.removeTarget(nil)
    }

    private func updateSystemCommandAvailability() {
        let hasCurrentMusic = currentMusic != nil
        let commandCenter = MPRemoteCommandCenter.shared()

        commandCenter.playCommand.isEnabled = hasCurrentMusic && !isPlaying
        commandCenter.pauseCommand.isEnabled = hasCurrentMusic && isPlaying
        commandCenter.togglePlayPauseCommand.isEnabled = hasCurrentMusic
        commandCenter.nextTrackCommand.isEnabled = hasCurrentMusic && (queue.count > 1 || isRadioMode)
        commandCenter.previousTrackCommand.isEnabled = hasCurrentMusic
        commandCenter.changePlaybackPositionCommand.isEnabled = hasCurrentMusic && duration > 0
    }

    private func updateSystemNowPlayingInfo(loadArtwork: Bool = false) {
        guard let music = currentMusic else {
            clearSystemNowPlayingInfo()
            return
        }

        // Keep system media surfaces authoritative for title, timing, queue
        // position, and playback rate; artwork is loaded separately.
        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
        info[MPMediaItemPropertyTitle] = music.name
        info[MPMediaItemPropertyArtist] = music.performerLine
        info[MPMediaItemPropertyPlaybackDuration] = duration
        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = currentTime
        info[MPNowPlayingInfoPropertyPlaybackRate] = isPlaying ? 1.0 : 0.0
        info[MPNowPlayingInfoPropertyDefaultPlaybackRate] = 1.0
        info[MPNowPlayingInfoPropertyPlaybackQueueIndex] = max(0, currentQueueIndex)
        info[MPNowPlayingInfoPropertyPlaybackQueueCount] = max(1, queue.count)
        info[MPNowPlayingInfoPropertyMediaType] = MPNowPlayingInfoMediaType.audio.rawValue
        info[MPNowPlayingInfoPropertyExternalContentIdentifier] = music.id
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
        MPNowPlayingInfoCenter.default().playbackState = isPlaying ? .playing : .paused

        updateSystemCommandAvailability()

        #if os(iOS)
        if loadArtwork {
            loadSystemArtwork(for: music)
        }
        #endif
    }

    #if os(iOS)
    private func loadSystemArtwork(for music: Music) {
        systemArtworkTask?.cancel()

        let artworkURLString = music.coverThumbnail?.isEmpty == false ? music.coverThumbnail : music.cover
        guard
            let artworkURLString,
            let artworkURL = URL(string: artworkURLString)
        else {
            removeSystemArtwork()
            return
        }

        let musicID = music.id
        systemArtworkTask = Task { [weak self, artworkURL, musicID] in
            guard
                let (data, _) = try? await URLSession.shared.data(from: artworkURL),
                !Task.isCancelled
            else {
                return
            }

            self?.applySystemArtwork(data: data, musicID: musicID)
        }
    }

    private func applySystemArtwork(data: Data, musicID: Music.ID) {
        guard
            currentMusic?.id == musicID,
            let image = SystemArtworkImage(data: data)
        else {
            return
        }

        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
        info[MPMediaItemPropertyArtwork] = MPMediaItemArtwork(boundsSize: image.size) { _ in
            image
        }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    private func removeSystemArtwork() {
        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
        info.removeValue(forKey: MPMediaItemPropertyArtwork)
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }
    #endif

    private func clearSystemNowPlayingInfo() {
        #if os(iOS)
        systemArtworkTask?.cancel()
        #endif
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        MPNowPlayingInfoCenter.default().playbackState = .stopped
        updateSystemCommandAvailability()
    }
    #else
    private func configureSystemMediaRemoteCommands() {}
    private func updateSystemNowPlayingInfo(loadArtwork: Bool = false) {}
    private func clearSystemNowPlayingInfo() {}
    #endif

    private func configureAudioSession() {
        #if os(iOS)
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
        try? AVAudioSession.sharedInstance().setActive(true)
        #endif
    }
}

private struct ActivePlaybackRecord {
    let clientRecordID = "\(UUID().uuidString)-\(Int64(Date().timeIntervalSince1970 * 1000))"
    let musicID: String
    var playedSeconds: Double = 0
    var lastCurrentTime: Double?
    var maxPercent: Double = 0
    var cacheTriggered = false
}
