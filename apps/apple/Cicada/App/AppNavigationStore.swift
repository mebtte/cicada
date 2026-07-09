import Foundation

struct PlayerContentRequest: Identifiable, Equatable {
    let id = UUID()
    let selection: PlayerContentSelection
}

final class AppNavigationStore: ObservableObject {
    @Published private(set) var playerContentRequest: PlayerContentRequest?

    func showSettings() {
        playerContentRequest = PlayerContentRequest(selection: .settings)
    }

    func consume(_ request: PlayerContentRequest) {
        guard playerContentRequest?.id == request.id else { return }
        playerContentRequest = nil
    }
}
