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
    case english = "en"
    case zhHans = "zh-Hans"
    case zhHant = "zh-Hant"

    static let `default`: AppLanguageOption = .system

    var id: String { rawValue }

    static func orderedCases(selected: AppLanguageOption) -> [AppLanguageOption] {
        // 当前语言固定排在首位，其余语言按规范语言 key 的英文顺序排列。
        let remainingCases = allCases
            .filter { $0 != selected }
            .sorted { $0.rawValue < $1.rawValue }
        return [selected] + remainingCases
    }

    var displayName: String {
        switch self {
        case .system:
            return "Follow System"
        case .zhHans:
            return "简体中文"
        case .zhHant:
            return "繁體中文"
        case .english:
            return "English"
        }
    }
}

enum OfflineCacheLimit: String, CaseIterable, Identifiable, Sendable {
    case gb5
    case gb50
    case unlimited

    static let `default`: OfflineCacheLimit = .gb5

    var id: String { rawValue }

    /// Maximum cache size in bytes, or `nil` for unlimited.
    var bytes: Int64? {
        switch self {
        case .gb5:
            return 5 * 1024 * 1024 * 1024
        case .gb50:
            return 50 * 1024 * 1024 * 1024
        case .unlimited:
            return nil
        }
    }

    var displayName: String {
        switch self {
        case .gb5:
            return "5 GB"
        case .gb50:
            return "50 GB"
        case .unlimited:
            return "Unlimited"
        }
    }
}

private enum AppSettingsStorageKey {
    static let musicPlaybackQuality = "io.github.manyone.cicada.apple.setting.musicPlaybackQuality"
    static let language = "io.github.manyone.cicada.apple.setting.language"
    static let offlineCacheEnabled = "io.github.manyone.cicada.apple.setting.offlineCacheEnabled"
    static let offlineCacheLimit = "io.github.manyone.cicada.apple.setting.offlineCacheLimit"
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

    @Published var offlineCacheEnabled: Bool {
        didSet {
            storage.set(offlineCacheEnabled, forKey: AppSettingsStorageKey.offlineCacheEnabled)
        }
    }

    @Published var offlineCacheLimit: OfflineCacheLimit {
        didSet {
            storage.set(offlineCacheLimit.rawValue, forKey: AppSettingsStorageKey.offlineCacheLimit)
        }
    }

    private let storage: UserDefaults

    init(storage: UserDefaults = .standard) {
        self.storage = storage
        let rawQuality = storage.string(forKey: AppSettingsStorageKey.musicPlaybackQuality)
        musicPlaybackQuality = MusicPlaybackQuality(rawValue: rawQuality ?? "") ?? .default
        let rawLanguage = storage.string(forKey: AppSettingsStorageKey.language)
        language = AppLanguageOption(rawValue: rawLanguage ?? "") ?? .default
        if storage.object(forKey: AppSettingsStorageKey.offlineCacheEnabled) == nil {
            offlineCacheEnabled = true
        } else {
            offlineCacheEnabled = storage.bool(forKey: AppSettingsStorageKey.offlineCacheEnabled)
        }
        let rawLimit = storage.string(forKey: AppSettingsStorageKey.offlineCacheLimit)
        offlineCacheLimit = OfflineCacheLimit(rawValue: rawLimit ?? "") ?? .default
    }
}

/// Thread-safe raw reads for the networking layer (`UserDefaults` is thread-safe).
enum AppSettingsSnapshot {
    static func musicPlaybackQuality(_ storage: UserDefaults = .standard) -> String {
        let raw = storage.string(forKey: AppSettingsStorageKey.musicPlaybackQuality)
        return MusicPlaybackQuality(rawValue: raw ?? "")?.rawValue ?? MusicPlaybackQuality.default.rawValue
    }

    static func clientLanguageQueryValue(_ storage: UserDefaults = .standard) -> String {
        let raw = storage.string(forKey: AppSettingsStorageKey.language) ?? AppLanguageOption.default.rawValue
        switch AppLanguageOption(rawValue: raw) ?? .default {
        case .system:
            let preferred = (Locale.preferredLanguages.first ?? Locale.current.identifier).lowercased()
            // 脚本标签优先；没有脚本时再按中文的常见地区标签判断。
            if preferred.hasPrefix("zh-hant")
                || preferred == "zh-tw" || preferred == "zh-hk" || preferred == "zh-mo"
            {
                return AppLanguageOption.zhHant.rawValue
            }
            if preferred == "zh" || preferred == "zh-cn" || preferred == "zh-sg"
                || preferred.hasPrefix("zh-hans")
            {
                return AppLanguageOption.zhHans.rawValue
            }
            return AppLanguageOption.english.rawValue
        case .zhHans:
            return AppLanguageOption.zhHans.rawValue
        case .zhHant:
            return AppLanguageOption.zhHant.rawValue
        case .english:
            return AppLanguageOption.english.rawValue
        }
    }

    static func offlineCacheEnabled(_ storage: UserDefaults = .standard) -> Bool {
        if storage.object(forKey: AppSettingsStorageKey.offlineCacheEnabled) == nil {
            return true
        }
        return storage.bool(forKey: AppSettingsStorageKey.offlineCacheEnabled)
    }

    static func maxOfflineCacheBytes(_ storage: UserDefaults = .standard) -> Int64? {
        let raw = storage.string(forKey: AppSettingsStorageKey.offlineCacheLimit)
        return (OfflineCacheLimit(rawValue: raw ?? "") ?? .default).bytes
    }
}
