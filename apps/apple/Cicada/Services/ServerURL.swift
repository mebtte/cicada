import Foundation

enum ServerURL {
    /// API and asset paths are relative to the Cicada service root, even when
    /// they start with `/`. Resolving them against the domain would lose a
    /// deployment prefix such as `/cicada`.
    static func url(baseURL: String, path: String, queryItems: [URLQueryItem] = []) -> URL? {
        guard var components = URLComponents(string: joined(baseURL: baseURL, path: path)) else {
            return nil
        }
        guard let scheme = components.scheme?.lowercased(),
              ["http", "https"].contains(scheme),
              let host = components.host, !host.isEmpty else {
            return nil
        }
        if !queryItems.isEmpty {
            components.queryItems = (components.queryItems ?? []) + queryItems
        }
        return components.url
    }

    static func assetURLString(_ rawValue: String?, baseURL: String) -> String {
        guard let rawValue else { return "" }
        let path = rawValue.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !path.isEmpty else { return "" }

        if let scheme = URLComponents(string: path)?.scheme?.lowercased(),
           ["http", "https", "data", "blob"].contains(scheme) {
            return path
        }
        if path.hasPrefix("//") {
            return "\(URL(string: baseURL)?.scheme ?? "https"):\(path)"
        }
        return joined(baseURL: baseURL, path: path)
    }

    private static func joined(baseURL: String, path: String) -> String {
        let base = baseURL.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let suffix = path.drop(while: { $0 == "/" })
        return "\(base)/\(suffix)"
    }
}
