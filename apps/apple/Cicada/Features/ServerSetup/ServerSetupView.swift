import SwiftUI

struct ServerSetupView: View {
    @ObservedObject var store: ServerSetupStore
    @FocusState private var originFieldFocused: Bool

    var body: some View {
        GeometryReader { geometry in
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if !store.savedServers.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Saved Servers")
                                .font(.headline)

                            VStack(spacing: 12) {
                                ForEach(store.savedServers) { server in
                                    savedServerRow(for: server)
                                }
                            }
                        }

                        HStack(spacing: 12) {
                            Divider()
                            Text("OR")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.secondary)
                            Divider()
                        }
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        Text(store.savedServers.isEmpty ? "Add Server" : "New Server")
                            .font(.headline)

                        Card {
                            VStack(alignment: .leading, spacing: 14) {
                                Text("Origin")
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(.secondary)

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
                                .font(.system(.body, design: .monospaced))
                                .focused($originFieldFocused)
                                .onSubmit {
                                    Task {
                                        await store.connectDraftOrigin()
                                    }
                                }

                                Text("Enter only the server origin.")
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)

                                HStack(alignment: .center, spacing: 12) {
                                    Button {
                                        Task {
                                            await store.connectDraftOrigin()
                                        }
                                    } label: {
                                        if store.isConnecting {
                                            Label("Checking…", systemImage: "ellipsis.circle")
                                        } else {
                                            Label("Add Server", systemImage: "plus.circle.fill")
                                        }
                                    }
                                    .buttonStyle(.borderedProminent)
                                    .disabled(store.draftOrigin.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || store.isConnecting)

                                    if let selectedServer = store.selectedServer {
                                        Text("Selected: \(selectedServer.hostname)")
                                            .font(.footnote)
                                            .foregroundStyle(.secondary)
                                            .lineLimit(1)
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, contentTopPadding)
                .padding(.bottom, 24)
                .frame(maxWidth: 460, alignment: .leading)
                .frame(
                    maxWidth: .infinity,
                    minHeight: geometry.size.height,
                    alignment: store.savedServers.isEmpty ? .center : .top
                )
            }
            .background(backgroundGradient)
        }
        #if os(iOS)
        .navigationTitle("Add Server")
        #endif
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

    private var contentTopPadding: CGFloat {
        #if os(macOS)
        store.savedServers.isEmpty ? 24 : 56
        #else
        24
        #endif
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

    private var backgroundGradient: some View {
        LinearGradient(
            colors: [
                Color.accentColor.opacity(0.06),
                .cicadaBackground,
                .cicadaBackground,
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        .ignoresSafeArea()
    }
}

private struct Card<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            content
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.cicadaSecondaryBackground)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(Color.primary.opacity(0.06))
        )
    }
}

private struct ServerRow: View {
    let server: ServerRecord
    let isSelected: Bool
    let onSelect: () -> Void
    let onDelete: () -> Void

    var body: some View {
        Card {
            HStack(alignment: .top, spacing: 14) {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "network")
                    .font(.title3)
                    .foregroundStyle(isSelected ? .green : Color.accentColor)
                    .frame(width: 24)

                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(server.hostname)
                            .font(.headline)
                        Spacer()
                        Text(server.version)
                            .font(.footnote.monospaced())
                            .foregroundStyle(.secondary)
                    }

                    Text(server.origin)
                        .font(.footnote.monospaced())
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.leading)
                }

                Menu {
                    Button("Remove Server", role: .destructive, action: onDelete)
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
            }
        }
        .contentShape(Rectangle())
        .onTapGesture(perform: onSelect)
        .contextMenu {
            Button("Remove Server", role: .destructive, action: onDelete)
        }
    }
}

#Preview {
    NavigationStack {
        ServerSetupView(store: .preview)
    }
}
