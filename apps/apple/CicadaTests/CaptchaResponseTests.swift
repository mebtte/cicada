import XCTest
@testable import Cicada

final class CaptchaResponseTests: XCTestCase {
    private let png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+nmZQAAAAASUVORK5CYII="

    func testCaptchaDecodesPNGImageResponse() throws {
        let dataURL = "data:image/png;base64,\(png)"
        let response = try JSONDecoder().decode(
            CaptchaResponse.self,
            from: JSONSerialization.data(withJSONObject: ["id": "captcha-id", "image": dataURL])
        )

        XCTAssertEqual(response.id, "captcha-id")
        XCTAssertEqual(response.image, dataURL)
        XCTAssertEqual(CaptchaResponse.pngData(from: response.image), Data(base64Encoded: png))
    }

    func testCaptchaOnlyAcceptsPNGDataURLs() {
        for value in [
            "", "https://music.local/captcha.png", "data:image/svg+xml;base64,\(png)",
            "data:image/jpeg;base64,\(png)", "data:image/png;base64,not-base64!",
            "data:image/png;base64,\(Data("<svg>answer</svg>".utf8).base64EncodedString())",
        ] {
            XCTAssertNil(CaptchaResponse.pngData(from: value))
        }
    }
}
