import SwiftUI

struct ServerSetupView: View {
    @ObservedObject var store: ServerSetupStore
    @FocusState private var originFieldFocused: Bool

    var body: some View {
        Form {
            if !store.savedServers.isEmpty {
                Section {
                    ForEach(store.savedServers) { server in
                        savedServerRow(for: server)
                    }
                } header: {
                    Text("Saved Servers")
                }
            }

            Section {
                TextField(
                    "https://music.example.com",
                    text: $store.draftOrigin
                )
                #if os(iOS)
                .textInputAutocapitalization(.never)
                #endif
                .autocorrectionDisabled()
                #if os(iOS)
                .keyboardType(.URL)
                #endif
                .textContentType(.URL)
                .focused($originFieldFocused)
                .onSubmit {
                    Task {
                        await store.connectDraftOrigin()
                    }
                }

                Button {
                    Task {
                        await store.connectDraftOrigin()
                    }
                } label: {
                    if store.isConnecting {
                        Label("Checking", systemImage: "ellipsis.circle")
                    } else {
                        Label("Add Server", systemImage: "plus.circle")
                    }
                }
                .disabled(store.draftOrigin.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || store.isConnecting)
            } header: {
                Text(store.savedServers.isEmpty ? "Add Server" : "New Server")
            } footer: {
                Text("Enter only the server origin.")
            }
        }
        .navigationTitle(store.savedServers.isEmpty ? "Add Server" : "Servers")
        .alert(
            "Unable to Add Server",
            isPresented: Binding(
                get: { store.errorMessage != nil },
                set: { isPresented in
                    if !isPresented {
                        store.dismissError()
                    }
                }
            )
        ) {
            Button("OK", role: .cancel) {
                store.dismissError()
            }
        } message: {
            Text(store.errorMessage ?? "")
        }
        .confirmationDialog(
            "Remove Server?",
            isPresented: Binding(
                get: { store.pendingDeletion != nil },
                set: { isPresented in
                    if !isPresented {
                        store.pendingDeletion = nil
                    }
                }
            ),
            titleVisibility: .visible
        ) {
            Button("Delete Server", role: .destructive) {
                store.deletePendingServer()
            }
            Button("Cancel", role: .cancel) {
                store.pendingDeletion = nil
            }
        } message: {
            Text(store.pendingDeletion?.origin ?? "")
        }
        .onAppear {
            originFieldFocused = store.savedServers.isEmpty
        }
    }

    @ViewBuilder
    private func savedServerRow(for server: ServerRecord) -> some View {
        ServerRow(
            server: server,
            isSelected: store.selectedServerOrigin == server.origin,
            onSelect: {
                store.select(server)
            },
            onDelete: {
                store.prepareToDelete(server)
            }
        )
    }
}

private struct ServerRow: View {
    let server: ServerRecord
    let isSelected: Bool
    let onSelect: () -> Void
    let onDelete: () -> Void

    var body: some View {
        Button(action: onSelect) {
            HStack(alignment: .center, spacing: 12) {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "network")
                    .foregroundStyle(isSelected ? .green : Color.accentColor)

                VStack(alignment: .leading, spacing: 6) {
                    Text(server.hostname)
                        .font(.body)

                    Text(server.origin)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                Spacer()

                Text(server.version)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .buttonStyle(.plain)
        .contextMenu {
            Button("Remove Server", role: .destructive, action: onDelete)
        }
        #if os(iOS)
        .swipeActions {
            Button("Delete", role: .destructive, action: onDelete)
        }
        #endif
    }
}

struct ServerSetupViewPreviews: PreviewProvider {
    static var previews: some View {
        NavigationStack {
            ServerSetupView(store: .preview)
        }
    }
}
