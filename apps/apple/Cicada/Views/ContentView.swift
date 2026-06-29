import SwiftUI

struct ContentView: View {
    @StateObject private var store = ServerSetupStore()

    var body: some View {
        Group {
            if store.selectedUser != nil {
                PlayerView(serverStore: store)
            } else {
                NavigationStack {
                    if store.selectedServer == nil {
                        ServerSetupView(store: store)
                    } else {
                        LoginView(store: store)
                    }
                }
            }
        }
    }
}

struct ContentViewPreviews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
