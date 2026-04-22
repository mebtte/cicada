import SwiftUI

struct ContentView: View {
    @StateObject private var store = ServerSetupStore()

    var body: some View {
        NavigationStack {
            ServerSetupView(store: store)
        }
    }
}

#Preview {
    ContentView()
}
