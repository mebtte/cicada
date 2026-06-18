import SwiftUI

struct ArtworkView: View {
    let urlString: String?
    let systemImage: String
    let size: CGFloat

    var body: some View {
        Group {
            if let url = imageURL {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        ProgressView()
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                    case .failure:
                        placeholder
                    @unknown default:
                        placeholder
                    }
                }
            } else {
                placeholder
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

    private var placeholder: some View {
        Image(systemName: systemImage)
            .font(.system(size: max(16, size * 0.42)))
            .foregroundStyle(.secondary)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
