import SwiftUI

#if os(macOS)
import AppKit
#endif

#if os(macOS)
private enum WindowMetrics {
    static let minimumWidth: CGFloat = 360
    static let minimumHeight: CGFloat = 624
}
#endif

@main
struct CicadaApp: App {
    @StateObject private var navigationStore = AppNavigationStore()

    #if os(macOS)
    init() {
        NSWindow.allowsAutomaticWindowTabbing = false
    }
    #endif

    var body: some Scene {
        #if os(macOS)
        Window("Cicada", id: "main") {
            ContentView()
                .environmentObject(navigationStore)
                .frame(
                    minWidth: WindowMetrics.minimumWidth,
                    minHeight: WindowMetrics.minimumHeight
                )
        }
        .defaultSize(
            width: WindowMetrics.minimumWidth,
            height: WindowMetrics.minimumHeight
        )
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentMinSize)
        .commands {
            CommandGroup(replacing: .appSettings) {
                Button("Settings...") {
                    navigationStore.showSettings()
                }
                .keyboardShortcut(",", modifiers: .command)
            }

            CommandGroup(replacing: .newItem) {}
        }
        #else
        WindowGroup {
            ContentView()
                .environmentObject(navigationStore)
        }
        #endif
    }
}
