import Foundation

@MainActor
final class PlayerStore: ObservableObject {
    @Published private(set) var musicbills: [MusicbillSummary] = []
    @Published var selectedMusicbillID: MusicbillSummary.ID?
    @Published private(set) var musicbillDetails: [MusicbillDetail.ID: MusicbillDetail] = [:]
    @Published private(set) var loadingMusicbillIDs: Set<MusicbillDetail.ID> = []
    @Published private(set) var isLoadingMusicbillList = false
    @Published var errorMessage: String?

    let audioPlayer = AudioPlayerController()

    private var client: CicadaAPIClient?
    private var user: ServerUserRecord?
    private var authKey: String?

    func configure(server: ServerRecord, user: ServerUserRecord) {
        let nextAuthKey = "\(server.origin)|\(user.id)|\(user.token)"
        guard authKey != nextAuthKey else { return }

        let client = CicadaAPIClient(server: server, user: user)
        self.client = client
        self.user = user
        authKey = nextAuthKey
        musicbills = []
        selectedMusicbillID = nil
        musicbillDetails = [:]
        loadingMusicbillIDs = []
        audioPlayer.configure(client: client)
    }

    func loadMusicbillList() async {
        guard let client, !isLoadingMusicbillList else { return }
        isLoadingMusicbillList = true
        defer { isLoadingMusicbillList = false }

        do {
            let list = try await client.getMusicbillList()
            musicbills = sortMusicbills(list)
            if selectedMusicbillID == nil || !musicbills.contains(where: { $0.id == selectedMusicbillID }) {
                selectedMusicbillID = musicbills.first?.id
            }
        } catch {
            errorMessage = presentableMessage(for: error)
        }
    }

    func loadMusicbill(id: MusicbillDetail.ID, force: Bool = false) async {
        guard let client else { return }
        if !force, musicbillDetails[id] != nil {
            return
        }
        guard !loadingMusicbillIDs.contains(id) else { return }

        loadingMusicbillIDs.insert(id)
        defer {
            loadingMusicbillIDs.remove(id)
        }

        do {
            let detail = try await client.getMusicbill(id: id)
            musicbillDetails[id] = detail
        } catch {
            errorMessage = presentableMessage(for: error)
        }
    }

    func play(music: Music, in musicbill: MusicbillDetail) {
        audioPlayer.play(music: music, in: musicbill.musicList)
    }

    func summary(for id: MusicbillSummary.ID) -> MusicbillSummary? {
        musicbills.first(where: { $0.id == id })
    }

    func deleteCurrentSession() async {
        guard let client else { return }
        try? await client.deleteCurrentSession()
    }

    func dismissError() {
        errorMessage = nil
        audioPlayer.errorMessage = nil
    }

    private func sortMusicbills(_ list: [MusicbillSummary]) -> [MusicbillSummary] {
        guard let orders = user?.musicbillOrders, !orders.isEmpty else {
            return list.sorted { $0.createTimestamp > $1.createTimestamp }
        }

        return list.sorted { lhs, rhs in
            let leftOrder = orders.firstIndex(of: lhs.id) ?? Int.max
            let rightOrder = orders.firstIndex(of: rhs.id) ?? Int.max
            if leftOrder != rightOrder {
                return leftOrder < rightOrder
            }
            return lhs.createTimestamp > rhs.createTimestamp
        }
    }

    private func presentableMessage(for error: Error) -> String {
        if let localizedError = error as? LocalizedError,
           let description = localizedError.errorDescription,
           !description.isEmpty {
            return description
        }
        return error.localizedDescription
    }
}
