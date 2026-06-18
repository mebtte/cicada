import Foundation

struct ServerMetadata: Decodable {
    let version: String
    let hostname: String
    let imageFileMaxSize: Int?
    let audioFileMaxSize: Int?
    let videoFileMaxSize: Int?
}

struct ServerMetadataClient {
    var fetchMetadata: @Sendable (_ origin: String) async throws -> ServerMetadata

    static let live = ServerMetadataClient { origin in
        let metadataURL = try metadataURL(for: origin)
        var request = URLRequest(url: metadataURL)
        request.timeoutInterval = 10
        request.cachePolicy = .reloadIgnoringLocalCacheData

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw ServerMetadataClientError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw ServerMetadataClientError.httpStatus(httpResponse.statusCode)
        }

        let envelope = try JSONDecoder().decode(MetadataEnvelope.self, from: data)
        guard envelope.code == "success" else {
            throw ServerMetadataClientError.serverMessage(
                envelope.message ?? envelope.code
            )
        }
        guard let metadata = envelope.data else {
            throw ServerMetadataClientError.missingPayload
        }
        return metadata
    }

    static let preview = ServerMetadataClient { _ in
        ServerMetadata(
            version: "preview",
            hostname: "demo.cicada.local",
            imageFileMaxSize: nil,
            audioFileMaxSize: nil,
            videoFileMaxSize: nil
        )
    }

    private static func metadataURL(for origin: String) throws -> URL {
        guard let baseURL = URL(string: origin) else {
            throw ServerMetadataClientError.invalidResponse
        }

        var components = URLComponents(
            url: baseURL.appending(path: "/api/base/metadata"),
            resolvingAgainstBaseURL: false
        )
        components?.queryItems = [
            URLQueryItem(name: "version", value: appVersion),
            URLQueryItem(name: "language", value: preferredLanguage),
        ]

        guard let url = components?.url else {
            throw ServerMetadataClientError.invalidResponse
        }
        return url
    }

    private static var appVersion: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String
            ?? "apple"
    }

    private static var preferredLanguage: String {
        Locale.preferredLanguages.first ?? Locale.current.identifier
    }
}

private struct MetadataEnvelope: Decodable {
    let code: String
    let message: String?
    let data: ServerMetadata?
}

enum ServerMetadataClientError: LocalizedError {
    case invalidResponse
    case httpStatus(Int)
    case serverMessage(String)
    case missingPayload

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "The server returned an invalid response."
        case .httpStatus(let statusCode):
            return "The server responded with HTTP \(statusCode)."
        case .serverMessage(let message):
            return message
        case .missingPayload:
            return "The server metadata response was empty."
        }
    }
}
