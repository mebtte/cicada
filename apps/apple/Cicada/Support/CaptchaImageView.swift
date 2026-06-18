import SwiftUI
import WebKit

#if os(iOS)
struct CaptchaImageView: UIViewRepresentable {
    let svg: String

    func makeUIView(context: Context) -> WKWebView {
        makeWebView()
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        webView.loadHTMLString(html, baseURL: nil)
    }
}
#elseif os(macOS)
struct CaptchaImageView: NSViewRepresentable {
    let svg: String

    func makeNSView(context: Context) -> WKWebView {
        makeWebView()
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
        webView.loadHTMLString(html, baseURL: nil)
    }
}
#endif

private extension CaptchaImageView {
    func makeWebView() -> WKWebView {
        let webView = WKWebView(frame: .zero)
        #if os(iOS)
        webView.isUserInteractionEnabled = false
        webView.scrollView.isScrollEnabled = false
        webView.isOpaque = false
        webView.backgroundColor = .clear
        #endif
        return webView
    }

    var html: String {
        """
        <!doctype html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            html, body {
              margin: 0;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              background: transparent;
              overflow: hidden;
            }
            svg {
              max-width: 100%;
              max-height: 100%;
            }
          </style>
        </head>
        <body>\(svg)</body>
        </html>
        """
    }
}
