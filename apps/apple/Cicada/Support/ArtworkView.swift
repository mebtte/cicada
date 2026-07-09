import SwiftUI
#if os(macOS)
import AppKit
#else
import UIKit
#endif

struct ArtworkView: View {
    let urlString: String?
    var placeholderURLString: String? = nil
    let systemImage: String
    let size: CGFloat

    var body: some View {
        Group {
            if let inlineImage {
                inlineImage
                    .resizable()
                    .scaledToFill()
            } else if let url = imageURL {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        loadingPlaceholder
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                    case .failure:
                        fallbackPlaceholder
                    @unknown default:
                        fallbackPlaceholder
                    }
                }
            } else {
                fallbackPlaceholder
            }
        }
        .frame(width: size, height: size)
        .background(Color.cicadaSecondaryBackground)
        .clipShape(RoundedRectangle(cornerRadius: min(8, size / 5), style: .continuous))
    }

    private var imageURL: URL? {
        guard
            let urlString,
            !urlString.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        else {
            return nil
        }
        return URL(string: urlString)
    }

    @ViewBuilder
    private var loadingPlaceholder: some View {
        if let placeholderImage {
            placeholderImage
                .resizable()
                .scaledToFill()
        } else {
            ProgressView()
        }
    }

    private var inlineImage: Image? {
        imageFromDataURL(urlString)
    }

    private var placeholderImage: Image? {
        imageFromDataURL(placeholderURLString)
    }

    private func imageFromDataURL(_ value: String?) -> Image? {
        guard
            let value,
            let commaIndex = value.firstIndex(of: ","),
            value[..<commaIndex].contains(";base64")
        else {
            return nil
        }

        let encoded = String(value[value.index(after: commaIndex)...])
        guard let data = Data(base64Encoded: encoded) else {
            return nil
        }

        #if os(macOS)
        if let image = NSImage(data: data) {
            return Image(nsImage: image)
        }
        #else
        if let image = UIImage(data: data) {
            return Image(uiImage: image)
        }
        #endif
        return nil
    }

    private var fallbackPlaceholder: some View {
        Image(systemName: systemImage)
            .font(.system(size: max(16, size * 0.42)))
            .foregroundStyle(.secondary)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
