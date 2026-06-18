import Foundation

enum AppVersion {
    static var current: String {
        infoString(for: "CicadaVersion")
            ?? infoString(for: "CFBundleShortVersionString")
            ?? "apple"
    }

    static func baseVersion(from version: String) -> String {
        let trimmed = version.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let suffixStart = trimmed.firstIndex(of: "-") else {
            return trimmed
        }
        return String(trimmed[..<suffixStart])
    }

    static func majorVersion(from version: String) -> Int? {
        guard var firstPart = baseVersion(from: version).split(separator: ".").first else {
            return nil
        }
        if firstPart.first == "v" {
            firstPart = firstPart.dropFirst()
        }
        return Int(firstPart)
    }

    private static func infoString(for key: String) -> String? {
        guard let value = Bundle.main.object(forInfoDictionaryKey: key) as? String else {
            return nil
        }

        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
