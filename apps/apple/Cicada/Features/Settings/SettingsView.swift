import SwiftUI

struct SettingsView: View {
    @ObservedObject var settings: AppSettingsStore

    @Environment(\.dismiss) private var dismiss

    private let feedbackURL = URL(string: "https://github.com/mebtte/cicada/issues")

    var body: some View {
        NavigationStack {
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
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}
