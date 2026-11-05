import SwiftUI

#if os(iOS)
import UIKit
#elseif os(macOS)
import AppKit
#endif

struct CaptchaImageView: View {
    let image: String

    var body: some View {
        Group {
            if let captchaImage {
                captchaImage
                    .resizable()
                    .interpolation(.high)
                    .aspectRatio(contentMode: .fit)
            } else {
                Image(systemName: "exclamationmark.triangle")
                    .foregroundStyle(.secondary)
            }
        }
        .accessibilityLabel("Verification code")
    }

    private var captchaImage: Image? {
        guard let data = CaptchaResponse.pngData(from: image) else {
            return nil
        }
        #if os(iOS)
        guard let image = UIImage(data: data) else { return nil }
        return Image(uiImage: image)
        #elseif os(macOS)
        guard let image = NSImage(data: data) else { return nil }
        return Image(nsImage: image)
        #endif
    }
}
