import SwiftUI

struct SettingsView: View {
    @ObservedObject var settings: AppSettingsStore
    @ObservedObject var playerStore: PlayerStore
    @ObservedObject var offlineCacheManager: OfflineCacheManager
    let showsDoneButton: Bool
    let embedsInNavigationStack: Bool

    @Environment(\.dismiss) private var dismiss

    private let feedbackURL = URL(string: "https://github.com/mebtte/cicada/issues")

    private var usageText: String {
        ByteCountFormatter.string(fromByteCount: offlineCacheManager.totalBytes, countStyle: .file)
    }

    init(
        settings: AppSettingsStore,
        playerStore: PlayerStore,
        offlineCacheManager: OfflineCacheManager,
        showsDoneButton: Bool = true,
        embedsInNavigationStack: Bool = true
    ) {
        self.settings = settings
        self.playerStore = playerStore
        self.offlineCacheManager = offlineCacheManager
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
        Form {
            Section {
                Picker("Playback Quality", selection: $settings.musicPlaybackQuality) {
                    ForEach(MusicPlaybackQuality.allCases) { quality in
                        Text(quality.displayName).tag(quality)
                    }
                }
            } header: {
                Text("Playback")
            } footer: {
                Text(settings.musicPlaybackQuality.detail)
            }

            Section {
                Picker("Language", selection: $settings.language) {
                    ForEach(AppLanguageOption.allCases) { option in
                        Text(option.displayName).tag(option)
                    }
                }
            } header: {
                Text("Language")
            } footer: {
                Text("Affects the language of server-provided content.")
            }

            Section {
                Toggle("Offline Cache", isOn: $settings.offlineCacheEnabled)

                Picker("Cache Limit", selection: $settings.offlineCacheLimit) {
                    ForEach(OfflineCacheLimit.allCases) { limit in
                        Text(limit.displayName).tag(limit)
                    }
                }

                NavigationLink {
                    OfflineCacheView(
                        playerStore: playerStore,
                        manager: offlineCacheManager
                    )
                } label: {
                    LabeledContent("Manage", value: usageText)
                }
            } header: {
                Text("Offline")
            } footer: {
                Text("Songs you play past 75% are cached automatically. Oldest songs are removed when the limit is reached.")
            }

            Section("About") {
                LabeledContent("Version", value: AppVersion.current)

                if let feedbackURL {
                    Link(destination: feedbackURL) {
                        Label("Feedback", systemImage: "exclamationmark.bubble")
                    }
                }
            }
        }
        .navigationTitle("Settings")
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
        }
    }
}
