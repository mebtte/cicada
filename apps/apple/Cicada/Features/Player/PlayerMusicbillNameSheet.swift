import Foundation
import SwiftUI

struct MusicbillNameSheet: View {
    let title: String
    let submitTitle: String
    let isSaving: Bool
    let onSubmit: (String) async -> Bool

    @Environment(\.dismiss) private var dismiss
    @State private var name: String

    init(
        title: String,
        initialName: String,
        submitTitle: String,
        isSaving: Bool,
        onSubmit: @escaping (String) async -> Bool
    ) {
        self.title = title
        self.submitTitle = submitTitle
        self.isSaving = isSaving
        self.onSubmit = onSubmit
        _name = State(initialValue: initialName)
    }

    private var trimmedName: String {
        name.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var canSubmit: Bool {
        !trimmedName.isEmpty && trimmedName.count <= 64 && !isSaving
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Name", text: $name)
                        .onSubmit {
                            guard canSubmit else { return }
                            Task {
                                await submit()
                            }
                        }

                    LabeledContent("Characters", value: "\(trimmedName.count)/64")
                        .font(.footnote)
                        .foregroundStyle(trimmedName.count > 64 ? Color.red : Color.secondary)
                }
            }
            .navigationTitle(title)
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .disabled(isSaving)
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        Task {
                            await submit()
                        }
                    } label: {
                        if isSaving {
                            ProgressView()
                        } else {
                            Text(submitTitle)
                        }
                    }
                    .disabled(!canSubmit)
                }
            }
        }
    }

    private func submit() async {
        let didSave = await onSubmit(trimmedName)
        if didSave {
            dismiss()
        }
    }
}
