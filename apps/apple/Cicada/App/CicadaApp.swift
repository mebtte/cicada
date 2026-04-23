import SwiftUI

#if os(macOS)
private enum WindowMetrics {
    static let minimumWidth: CGFloat = 360
    static let minimumHeight: CGFloat = 624
}
#endif

@main
struct CicadaApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
            #if os(macOS)
                .frame(
                    minWidth: WindowMetrics.minimumWidth,
                    minHeight: WindowMetrics.minimumHeight
                )
            #endif
        }
        #if os(macOS)
        .defaultSize(
            width: WindowMetrics.minimumWidth,
            height: WindowMetrics.minimumHeight
        )
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentMinSize)
        #endif
    }
}
