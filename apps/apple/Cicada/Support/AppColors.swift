import SwiftUI

#if os(macOS)
import AppKit
#else
import UIKit
#endif

extension Color {
    static let cicadaPrimary = Color(red: 44.0 / 255.0, green: 182.0 / 255.0, blue: 125.0 / 255.0)

    static var cicadaSidebarBackground: Color {
        // Mirrors the PWA `--background-color-level-one` token: rgb(44 182 125 / 0.06).
        cicadaPrimary.opacity(0.06)
    }

    static var cicadaSidebarVoidBackground: Color {
        Color.white
    }

    static var cicadaBackground: Color {
        #if os(macOS)
        Color(nsColor: .windowBackgroundColor)
        #else
        Color(uiColor: .systemBackground)
        #endif
    }

    static var cicadaSecondaryBackground: Color {
        #if os(macOS)
        Color(nsColor: .controlBackgroundColor)
        #else
        Color(uiColor: .secondarySystemBackground)
        #endif
    }
}
