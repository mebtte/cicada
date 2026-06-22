import Foundation

enum MusicPlaybackQuality: String, CaseIterable, Identifiable, Sendable {
    case smooth
    case source

    static let `default`: MusicPlaybackQuality = .smooth

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .smooth:
            return "Smooth"
        case .source:
            return "Source"
        }
    }

    var detail: String {
        switch self {
        case .smooth:
            return "Transcoded for smaller size and faster start."
        case .source:
            return "Original file without transcoding."
        }
    }
}

enum AppLanguageOption: String, CaseIterable, Identifiable, Sendable {
    case system
    case zhHans = "zh-hans"
    case english = "en"

    static let `default`: AppLanguageOption = .system

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .system:
            return "Follow System"
        case .zhHans:
            return "简体中文"
        case .english:
            return "English"
        }
    }
}

private enum AppSettingsStorageKey {
    static let musicPlaybackQuality = "io.github.manyone.cicada.apple.setting.musicPlaybackQuality"
    static let language = "io.github.manyone.cicada.apple.setting.language"
}

/// UI-facing observable settings store. Writes are mirrored into `UserDefaults`
/// so the networking layer can read raw values without crossing actor boundaries.
@MainActor
final class AppSettingsStore: ObservableObject {
    static let shared = AppSettingsStore()

    @Published var musicPlaybackQuality: MusicPlaybackQuality {
        didSet {
            storage.set(musicPlaybackQuality.rawValue, forKey: AppSettingsStorageKey.musicPlaybackQuality)
        }
    }

    @Published var language: AppLanguageOption {
        didSet {
            storage.set(language.rawValue, forKey: AppSettingsStorageKey.language)
        }
    }

    private let storage: UserDefaults

    init(storage: UserDefaults = .standard) {
        self.storage = storage
        let rawQuality = storage.string(forKey: AppSettingsStorageKey.musicPlaybackQuality)
        musicPlaybackQuality = MusicPlaybackQuality(rawValue: rawQuality ?? "") ?? .default
        let rawLanguage = storage.string(forKey: AppSettingsStorageKey.language)
        language = AppLanguageOption(rawValue: rawLanguage ?? "") ?? .default
    }
}

/// Thread-safe raw reads for the networking layer (`UserDefaults` is thread-safe).
enum AppSettingsSnapshot {
    static func musicPlaybackQuality(_ storage: UserDefaults = .standard) -> String {
        let raw = storage.string(forKey: AppSettingsStorageKey.musicPlaybackQuality)
        return MusicPlaybackQuality(rawValue: raw ?? "")?.rawValue ?? MusicPlaybackQuality.default.rawValue
    }

    static func languageQueryValue(_ storage: UserDefaults = .standard) -> String {
        let raw = storage.string(forKey: AppSettingsStorageKey.language) ?? AppLanguageOption.default.rawValue
        switch AppLanguageOption(rawValue: raw) ?? .default {
        case .system:
            return Locale.preferredLanguages.first ?? Locale.current.identifier
        case .zhHans:
            return AppLanguageOption.zhHans.rawValue
        case .english:
            return AppLanguageOption.english.rawValue
        }
    }
}
