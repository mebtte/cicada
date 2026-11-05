import XCTest
@testable import Cicada

final class ServerURLTests: XCTestCase {
    func testAPIRequestKeepsServicePathAndEncodesQuery() throws {
        let client = CicadaAPIClient(baseURL: "https://music.local/tools/cicada")
        let url = try XCTUnwrap(client.makeURL(path: "/api/common/music", query: ["id": "a&b ?"]))
        let components = try XCTUnwrap(URLComponents(url: url, resolvingAgainstBaseURL: false))

        XCTAssertEqual(components.path, "/tools/cicada/api/common/music")
        XCTAssertEqual(components.host, "music.local")
        XCTAssertEqual(components.queryItems?.first(where: { $0.name == "id" })?.value, "a&b ?")
        XCTAssertEqual(components.queryItems?.filter { $0.name == "__client_language" }.count, 1)
    }

    func testMetadataRequestKeepsServicePath() throws {
        let url = try ServerMetadataClient.metadataURL(for: "https://music.local/cicada")
        XCTAssertEqual(url.path, "/cicada/api/base/metadata")
        XCTAssertTrue(url.query?.contains("__client_language=") == true)
    }

    func testRootDeploymentAndTrailingSlashJoinConsistently() throws {
        for baseURL in ["https://music.local", "https://music.local/"] {
            let client = CicadaAPIClient(baseURL: baseURL)
            XCTAssertEqual(
                try XCTUnwrap(client.makeURL(path: "/api/base/captcha", query: [:])).path,
                "/api/base/captcha"
            )
            XCTAssertEqual(client.absoluteURLString("/asset/music/a.mp3"), "https://music.local/asset/music/a.mp3")
        }
    }

    func testAssetsResolveAgainstServiceRootOnceAndPreserveQuery() {
        let client = CicadaAPIClient(baseURL: "https://music.local/cicada/")
        for path in ["/asset/music/a.mp3?quality=source", "asset/music/a.mp3?quality=source"] {
            XCTAssertEqual(client.absoluteURLString(path), "https://music.local/cicada/asset/music/a.mp3?quality=source")
        }
        XCTAssertEqual(client.absoluteURLString(nil), "")
        XCTAssertEqual(client.absoluteURLString("  "), "")
    }

    func testAbsoluteAndEmbeddedAssetsArePreserved() {
        let client = CicadaAPIClient(baseURL: "http://music.local/cicada")
        for path in ["https://cdn.local/a.png", "data:image/png;base64,a", "blob:https://music.local/id"] {
            XCTAssertEqual(client.absoluteURLString(path), path)
        }
        XCTAssertEqual(client.absoluteURLString("//cdn.local/a.png"), "http://cdn.local/a.png")
    }
}
