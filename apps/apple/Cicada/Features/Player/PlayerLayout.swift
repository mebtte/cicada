import Foundation
import SwiftUI

#if os(macOS)
enum MacPlayerLayoutMetrics {
    static let collapseWidth: CGFloat = 760
    static let sidebarWidth: CGFloat = 280
    static let overlayMaximumWidth: CGFloat = 320
    static let overlayWidthRatio: CGFloat = 0.82
    static let edgePadding: CGFloat = 12
    static let contentSpacing: CGFloat = 0
    static let sidebarCornerRadius: CGFloat = 18
}

struct MacPlayerLayout<Sidebar: View, Detail: View>: View {
    @Binding var isSidebarPresented: Bool
    private let sidebar: Sidebar
    private let detail: Detail

    init(
        isSidebarPresented: Binding<Bool>,
        @ViewBuilder sidebar: () -> Sidebar,
        @ViewBuilder detail: () -> Detail
    ) {
        _isSidebarPresented = isSidebarPresented
        self.sidebar = sidebar()
        self.detail = detail()
    }

    var body: some View {
        GeometryReader { proxy in
            let isCollapsed = proxy.size.width < MacPlayerLayoutMetrics.collapseWidth
            // Keep the floating panel 12pt from the window edge, not 12pt below the macOS titlebar safe area.
            let sidebarTopPadding = MacPlayerLayoutMetrics.edgePadding - proxy.safeAreaInsets.top
            let overlayWidth = min(
                MacPlayerLayoutMetrics.overlayMaximumWidth,
                max(MacPlayerLayoutMetrics.sidebarWidth, proxy.size.width * MacPlayerLayoutMetrics.overlayWidthRatio)
            )

            ZStack(alignment: .leading) {
                Color.cicadaSidebarVoidBackground
                    .ignoresSafeArea()

                HStack(spacing: MacPlayerLayoutMetrics.contentSpacing) {
                    if !isCollapsed {
                        floatingSidebar
                            .frame(width: MacPlayerLayoutMetrics.sidebarWidth)
                            .padding(.leading, MacPlayerLayoutMetrics.edgePadding)
                            .padding(.top, sidebarTopPadding)
                            .padding(.bottom, MacPlayerLayoutMetrics.edgePadding)
                    }

                    NavigationStack {
                        detail
                            .toolbar {
                                if isCollapsed {
                                    ToolbarItem(placement: .navigation) {
                                        Button {
                                            withAnimation(.easeInOut(duration: 0.18)) {
                                                isSidebarPresented.toggle()
                                            }
                                        } label: {
                                            Image(systemName: "sidebar.left")
                                        }
                                        .help("Show Sidebar")
                                    }
                                }
                            }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.cicadaBackground)
                }

                if isCollapsed && isSidebarPresented {
                    Color.black.opacity(0.18)
                        .ignoresSafeArea()
                        .onTapGesture {
                            withAnimation(.easeInOut(duration: 0.18)) {
                                isSidebarPresented = false
                            }
                        }

                    HStack(spacing: 0) {
                        floatingSidebar
                            .frame(width: overlayWidth)
                            .padding(.leading, MacPlayerLayoutMetrics.edgePadding)
                            .padding(.top, sidebarTopPadding)
                            .padding(.bottom, MacPlayerLayoutMetrics.edgePadding)

                        Spacer(minLength: 0)
                    }
                    .transition(.move(edge: .leading))
                }
            }
            .onChange(of: isCollapsed) { _, isCollapsed in
                if !isCollapsed {
                    isSidebarPresented = false
                }
            }
        }
    }

    private var floatingSidebar: some View {
        sidebar
            .background(
                RoundedRectangle(
                    cornerRadius: MacPlayerLayoutMetrics.sidebarCornerRadius,
                    style: .continuous
                )
                .fill(Color.cicadaSidebarBackground)
            )
            .overlay {
                RoundedRectangle(
                    cornerRadius: MacPlayerLayoutMetrics.sidebarCornerRadius,
                    style: .continuous
                )
                .stroke(Color.primary.opacity(0.06), lineWidth: 1)
            }
            .clipShape(
                RoundedRectangle(
                    cornerRadius: MacPlayerLayoutMetrics.sidebarCornerRadius,
                    style: .continuous
                )
            )
            .shadow(color: Color.black.opacity(0.13), radius: 18, x: 0, y: 10)
    }
}
#endif
