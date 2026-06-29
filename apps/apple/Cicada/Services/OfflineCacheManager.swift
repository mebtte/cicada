import Foundation

struct OfflineMusic: Codable, Identifiable, Hashable {
    struct Artist: Codable, Hashable {
        let id: String
        let name: String
        let aliases: [String]
    }

    let musicID: String
    let type: Int
    let name: String
    let aliases: [String]
    let cover: String
    let coverThumbnail: String?
    let asset: String
    let performers: [Artist]
    let lyricists: [Artist]
    let composers: [Artist]
    let quality: String
    let cachedAt: TimeInterval
    let fileSize: Int64

    /// Unique per music + quality so the same song cached at different qualities
    /// stays as distinct entries.
    var id: String { "\(musicID).\(quality)" }

    var performerLine: String {
        let names = performers.map(\.name)
        return names.isEmpty ? "Unknown Artist" : names.joined(separator: ", ")
    }

    func asMusic() -> Music {
        func summaries(_ artists: [Artist]) -> [ArtistSummary] {
            artists.map { ArtistSummary(id: $0.id, name: $0.name, aliases: $0.aliases) }
        }
        return Music(
            id: musicID,
            type: type,
            name: name,
            aliases: aliases,
            cover: cover,
            coverThumbnail: coverThumbnail,
            asset: asset,
            performers: summaries(performers),
            lyricists: summaries(lyricists),
            composers: summaries(composers)
        )
    }
}

/// A single, global on-disk cache of audio assets. Audio files are identical for
/// every user, so the cache is shared across accounts and never cleared on
/// account switch — only the explicit "Clear All" action empties it.
@MainActor
final class OfflineCacheManager: ObservableObject {
    @Published private(set) var items: [OfflineMusic] = []
    @Published private(set) var downloadingIDs: Set<String> = []
    @Published private(set) var totalBytes: Int64 = 0

    /// Lets the owner protect the currently-playing track from LRU eviction
    /// (its file may be open in AVPlayer).
    var isMusicProtected: ((String) -> Bool)?

    private var client: CicadaAPIClient?
    private var manifest: [String: OfflineMusic] = [:]

    private let fileManager = FileManager.default

    init() {
        load()
    }

    func configure(client: CicadaAPIClient) {
        self.client = client
    }

    // MARK: - Lookup

    func isCached(musicID: String, quality: String) -> Bool {
        fileManager.fileExists(atPath: assetFileURL(musicID: musicID, quality: quality).path)
    }

    /// Returns a local `file://` URL for the current playback quality, if cached.
    func localPlaybackURL(for music: Music) -> URL? {
        let quality = AppSettingsSnapshot.musicPlaybackQuality()
        let url = assetFileURL(musicID: music.id, quality: quality)
        return fileManager.fileExists(atPath: url.path) ? url : nil
    }

    // MARK: - Caching

    func cache(_ music: Music) async {
        let quality = AppSettingsSnapshot.musicPlaybackQuality()
        let key = cacheKey(musicID: music.id, quality: quality)
        guard !downloadingIDs.contains(key) else { return }
        if manifest[key] != nil, isCached(musicID: music.id, quality: quality) {
            return
        }
        guard let client, let request = client.assetDownloadRequest(for: music) else { return }

        downloadingIDs.insert(key)
        defer { downloadingIDs.remove(key) }

        do {
            ensureCacheDirectory()
            let (tempURL, response) = try await URLSession.shared.download(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                try? fileManager.removeItem(at: tempURL)
                return
            }

            let destination = assetFileURL(musicID: music.id, quality: quality)
            try? fileManager.removeItem(at: destination)
            try fileManager.moveItem(at: tempURL, to: destination)

            let entry = makeOfflineMusic(from: music, quality: quality, fileSize: fileSize(at: destination))
            manifest[key] = entry
            persistManifest()
            refreshPublished()
            enforceLimit(justCachedKey: key)
        } catch {
            // Fire-and-forget: a failed cache attempt should never disrupt playback.
        }
    }

    // MARK: - Management

    func remove(id: OfflineMusic.ID) {
        guard let entry = manifest[id] else { return }
        let url = assetFileURL(musicID: entry.musicID, quality: entry.quality)
        try? fileManager.removeItem(at: url)
        manifest[id] = nil
        persistManifest()
        refreshPublished()
    }

    func clearAll() {
        for entry in manifest.values {
            let url = assetFileURL(musicID: entry.musicID, quality: entry.quality)
            try? fileManager.removeItem(at: url)
        }
        manifest = [:]
        persistManifest()
        refreshPublished()
    }

    // MARK: - Internals

    private func enforceLimit(justCachedKey: String) {
        guard let maxBytes = AppSettingsSnapshot.maxOfflineCacheBytes() else { return }
        guard totalBytes > maxBytes else { return }

        // Evict oldest first, never the just-cached entry or a protected (playing) track.
        let candidates = manifest.values
            .filter { $0.id != justCachedKey && isMusicProtected?($0.musicID) != true }
            .sorted { $0.cachedAt < $1.cachedAt }

        var freed = false
        for entry in candidates {
            if totalBytes <= maxBytes { break }
            let url = assetFileURL(musicID: entry.musicID, quality: entry.quality)
            try? fileManager.removeItem(at: url)
            manifest[entry.id] = nil
            totalBytes -= entry.fileSize
            freed = true
        }
        if freed {
            persistManifest()
            refreshPublished()
        }
    }

    private func refreshPublished() {
        items = manifest.values.sorted { $0.cachedAt > $1.cachedAt }
        totalBytes = manifest.values.reduce(0) { $0 + $1.fileSize }
    }

    private func load() {
        guard
            let data = try? Data(contentsOf: manifestFileURL),
            let stored = try? JSONDecoder().decode([String: OfflineMusic].self, from: data)
        else {
            manifest = [:]
            refreshPublished()
            return
        }
        // Drop entries whose backing file vanished.
        manifest = stored.filter { _, entry in
            fileManager.fileExists(atPath: assetFileURL(musicID: entry.musicID, quality: entry.quality).path)
        }
        if manifest.count != stored.count {
            persistManifest()
        }
        refreshPublished()
    }

    private func persistManifest() {
        ensureCacheDirectory()
        guard let data = try? JSONEncoder().encode(manifest) else { return }
        try? data.write(to: manifestFileURL, options: .atomic)
    }

    private func makeOfflineMusic(from music: Music, quality: String, fileSize: Int64) -> OfflineMusic {
        func artists(_ summaries: [ArtistSummary]) -> [OfflineMusic.Artist] {
            summaries.map { OfflineMusic.Artist(id: $0.id, name: $0.name, aliases: $0.aliases) }
        }
        return OfflineMusic(
            musicID: music.id,
            type: music.type,
            name: music.name,
            aliases: music.aliases,
            cover: music.cover,
            coverThumbnail: music.coverThumbnail,
            asset: music.asset,
            performers: artists(music.performers),
            lyricists: artists(music.lyricists),
            composers: artists(music.composers),
            quality: quality,
            cachedAt: Date().timeIntervalSince1970,
            fileSize: fileSize
        )
    }

    private func cacheKey(musicID: String, quality: String) -> String {
        "\(musicID).\(quality)"
    }

    private func fileSize(at url: URL) -> Int64 {
        guard
            let attributes = try? fileManager.attributesOfItem(atPath: url.path),
            let size = (attributes[.size] as? NSNumber)?.int64Value
        else {
            return 0
        }
        return size
    }

    private func assetFileURL(musicID: String, quality: String) -> URL {
        cacheDirectory.appendingPathComponent("\(musicID).\(quality).audio")
    }

    private var manifestFileURL: URL {
        cacheDirectory.appendingPathComponent("manifest.json")
    }

    private var cacheDirectory: URL {
        let base = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? fileManager.temporaryDirectory
        return base.appendingPathComponent("OfflineCache", isDirectory: true)
    }

    private func ensureCacheDirectory() {
        try? fileManager.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
    }
}
