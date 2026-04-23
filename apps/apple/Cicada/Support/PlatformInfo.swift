import Foundation

#if os(iOS)
import UIKit
#endif

enum PlatformInfo {
    static var currentDisplayName: String {
        #if os(macOS)
        return "macOS"
        #elseif os(iOS)
        switch UIDevice.current.userInterfaceIdiom {
        case .pad:
            return "iPadOS"
        case .phone:
            return "iOS"
        default:
            return "iOS"
        }
        #else
        return "Apple"
        #endif
    }

    static var currentDescription: String {
        #if os(macOS)
        return "The native Mac experience can grow into menu commands, multiple windows, and keyboard-first navigation."
        #elseif os(iOS)
        switch UIDevice.current.userInterfaceIdiom {
        case .pad:
            return "The same target can expand into wider split views, richer sidebars, and drag-and-drop workflows on iPad."
        case .phone:
            return "On iPhone the shared target collapses into a compact navigation flow while keeping the same domain model."
        default:
            return "This shared Apple target is ready for more device-specific polish when the product surface grows."
        }
        #else
        return "This shared Apple target is ready for more device-specific polish when the product surface grows."
        #endif
    }
}
