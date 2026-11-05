import Foundation

struct ServerMetadata: Decodable {
    let version: String
    let hostname: String
    let imageFileMaxSize: Int?
    let audioFileMaxSize: Int?
    let videoFileMaxSize: Int?
}

struct ServerMetadataClient {
    var fetchMetadata: @Sendable (_ baseURL: String) async throws -> ServerMetadata

    static let live = ServerMetadataClient { baseURL in
        let metadataURL = try metadataURL(for: baseURL)
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
            throw ServerMetadataClientError.serverMessage(envelope.message)
        }
        guard let metadata = envelope.data else {
            throw ServerMetadataClientError.missingPayload
        }
        return metadata
    }

    static let preview = ServerMetadataClient { _ in
        ServerMetadata(
            version: AppVersion.baseVersion(from: AppVersion.current),
            hostname: "demo.cicada.local",
            imageFileMaxSize: nil,
            audioFileMaxSize: nil,
            videoFileMaxSize: nil
        )
    }

    static func metadataURL(for baseURL: String) throws -> URL {
        guard let url = ServerURL.url(
            baseURL: baseURL,
            path: "/api/base/metadata",
            queryItems: CicadaAPIQuery.commonItems()
        ) else {
            throw ServerMetadataClientError.invalidResponse
        }
        return url
    }
}

private struct MetadataEnvelope: Decodable {
    let code: String
    let message: String
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
