package apidoc

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func servePage(c *gin.Context) {
	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(docsPageHTML))
}

const docsPageHTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cicada API Docs</title>
  <style>
    :root {
      --bg: #f4efe4;
      --panel: rgba(255, 252, 244, 0.9);
      --panel-strong: rgba(255, 252, 244, 0.98);
      --text: #1f1b16;
      --muted: #655d53;
      --border: rgba(74, 58, 39, 0.14);
      --shadow: 0 20px 50px rgba(53, 38, 18, 0.12);
      --get: #2e7d5b;
      --post: #8f4a12;
      --put: #1e5b82;
      --delete: #8d2f2f;
      --chip: #f0e4cf;
      --code-bg: #1b1a17;
      --code-text: #efe8da;
      --accent: #c96b2c;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      color: var(--text);
      font-family: "IBM Plex Sans", "Avenir Next", "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at top left, rgba(218, 134, 57, 0.18), transparent 28%),
        radial-gradient(circle at top right, rgba(86, 118, 90, 0.16), transparent 24%),
        linear-gradient(180deg, #f8f3e8 0%, #f1eadc 100%);
    }

    a {
      color: inherit;
    }

    .layout {
      display: grid;
      grid-template-columns: 320px minmax(0, 1fr);
      min-height: 100vh;
    }

    .sidebar {
      position: sticky;
      top: 0;
      height: 100vh;
      padding: 28px 22px;
      border-right: 1px solid var(--border);
      background: rgba(250, 245, 237, 0.86);
      backdrop-filter: blur(10px);
      overflow: auto;
    }

    .brand {
      margin-bottom: 22px;
    }

    .brand h1 {
      margin: 0;
      font-size: 1.7rem;
      line-height: 1.1;
      letter-spacing: -0.03em;
      font-family: "Iowan Old Style", "Palatino Linotype", serif;
    }

    .brand p {
      margin: 10px 0 0;
      color: var(--muted);
      font-size: 0.96rem;
      line-height: 1.5;
    }

    .search {
      width: 100%;
      margin-bottom: 16px;
      padding: 11px 14px;
      border: 1px solid var(--border);
      border-radius: 14px;
      background: var(--panel-strong);
      color: var(--text);
      font: inherit;
    }

    .raw-link {
      display: inline-flex;
      align-items: center;
      margin-bottom: 24px;
      padding: 8px 12px;
      border-radius: 999px;
      text-decoration: none;
      background: var(--chip);
      font-size: 0.9rem;
    }

    .nav-tag {
      margin-top: 20px;
    }

    .nav-tag h2 {
      margin: 0 0 10px;
      font-size: 0.76rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
    }

    .nav-list {
      display: grid;
      gap: 8px;
    }

    .nav-item {
      display: grid;
      gap: 4px;
      padding: 10px 12px;
      border: 1px solid transparent;
      border-radius: 14px;
      background: rgba(255, 252, 244, 0.72);
      text-decoration: none;
      transition: border-color 120ms ease, transform 120ms ease;
    }

    .nav-item:hover {
      border-color: var(--border);
      transform: translateX(2px);
    }

    .nav-summary {
      font-size: 0.93rem;
      font-weight: 600;
    }

    .nav-path {
      color: var(--muted);
      font-size: 0.82rem;
      font-family: "IBM Plex Mono", "Menlo", monospace;
      word-break: break-all;
    }

    .nav-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .nav-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 999px;
      background: rgba(31, 27, 22, 0.08);
      color: var(--muted);
      font-size: 0.72rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .content {
      padding: 32px clamp(18px, 4vw, 44px) 48px;
    }

    .hero {
      margin-bottom: 26px;
      padding: 24px 26px;
      border: 1px solid var(--border);
      border-radius: 24px;
      background: var(--panel);
      box-shadow: var(--shadow);
    }

    .hero h2 {
      margin: 0 0 10px;
      font-size: clamp(1.9rem, 4vw, 2.7rem);
      line-height: 0.95;
      letter-spacing: -0.04em;
      font-family: "Iowan Old Style", "Palatino Linotype", serif;
    }

    .hero p {
      max-width: 72ch;
      margin: 0;
      color: var(--muted);
      line-height: 1.6;
    }

    .status {
      margin-top: 12px;
      color: var(--muted);
      font-size: 0.9rem;
    }

    .cards {
      display: grid;
      gap: 18px;
    }

    .auth-grid {
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .auth-list {
      margin: 0;
      padding-left: 18px;
      color: var(--muted);
      line-height: 1.6;
    }

    .auth-list li + li {
      margin-top: 8px;
    }

    .card {
      padding: 22px;
      border: 1px solid var(--border);
      border-radius: 22px;
      background: var(--panel);
      box-shadow: var(--shadow);
    }

    .card-head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px 12px;
      margin-bottom: 14px;
    }

    .method {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 70px;
      padding: 7px 10px;
      border-radius: 999px;
      color: #fff;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .method.get { background: var(--get); }
    .method.post { background: var(--post); }
    .method.put { background: var(--put); }
    .method.delete { background: var(--delete); }

    .path {
      font-family: "IBM Plex Mono", "Menlo", monospace;
      font-size: 0.94rem;
      word-break: break-all;
    }

    .summary {
      margin: 0 0 8px;
      font-size: 1.2rem;
      letter-spacing: -0.02em;
    }

    .description {
      margin: 0;
      color: var(--muted);
      line-height: 1.55;
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: 999px;
      background: var(--chip);
      color: #4d3c27;
      font-size: 0.8rem;
    }

    .sections {
      display: grid;
      gap: 16px;
      margin-top: 18px;
    }

    .section {
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }

    .section h4 {
      margin: 0 0 10px;
      font-size: 0.92rem;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      color: var(--muted);
    }

    .table-wrap {
      overflow: auto;
      border: 1px solid var(--border);
      border-radius: 16px;
      background: var(--panel-strong);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.92rem;
    }

    th, td {
      padding: 11px 12px;
      border-bottom: 1px solid var(--border);
      text-align: left;
      vertical-align: top;
    }

    tr:last-child td {
      border-bottom: 0;
    }

    th {
      font-size: 0.76rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
    }

    details {
      border: 1px solid var(--border);
      border-radius: 16px;
      background: var(--panel-strong);
      overflow: hidden;
    }

    summary {
      cursor: pointer;
      list-style: none;
      padding: 12px 14px;
      font-weight: 600;
    }

    summary::-webkit-details-marker {
      display: none;
    }

    pre {
      margin: 0;
      padding: 16px;
      overflow: auto;
      background: var(--code-bg);
      color: var(--code-text);
      font-size: 0.86rem;
      line-height: 1.5;
      font-family: "IBM Plex Mono", "Menlo", monospace;
    }

    .empty {
      padding: 24px;
      border: 1px dashed var(--border);
      border-radius: 22px;
      color: var(--muted);
      text-align: center;
      background: rgba(255, 252, 244, 0.5);
    }

    .hidden {
      display: none !important;
    }

    @media (max-width: 980px) {
      .layout {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: static;
        height: auto;
        border-right: 0;
        border-bottom: 1px solid var(--border);
      }

      .content {
        padding-top: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <div class="brand">
        <h1>Cicada API</h1>
        <p>OpenAPI-backed reference for the current Go service.</p>
      </div>
      <input id="search" class="search" type="search" placeholder="Search path, summary, or tag">
      <a class="raw-link" href="/apidoc/openapi.json" target="_blank" rel="noreferrer">View raw OpenAPI JSON</a>
      <nav id="nav"></nav>
    </aside>
    <main class="content">
      <section class="hero">
        <h2>API Reference</h2>
        <p id="hero-copy">Loading the OpenAPI document.</p>
        <div id="status" class="status"></div>
      </section>
      <section id="auth-guide"></section>
      <section id="cards" class="cards"></section>
    </main>
  </div>

  <script>
    const methodOrder = ["get", "post", "put", "delete", "patch"];

    const escapeHtml = (value) =>
      String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");

    const pretty = (value) => JSON.stringify(value, null, 2);

    const methodClass = (method) => method.toLowerCase();

    const exampleFromContent = (content) => {
      if (!content) return null;
      const media = content["application/json"] || Object.values(content)[0];
      if (!media) return null;
      if (media.example !== undefined) return media.example;
      if (media.examples) {
        const first = Object.values(media.examples)[0];
        if (first && first.value !== undefined) return first.value;
      }
      if (media.schema) return media.schema;
      return null;
    };

    const renderParams = (params) => {
      if (!params || !params.length) return "";
      const rows = params.map((param) =>
        "<tr>" +
          "<td><code>" + escapeHtml(param.name) + "</code></td>" +
          "<td>" + escapeHtml(param.in || "") + "</td>" +
          "<td>" + (param.required ? "yes" : "no") + "</td>" +
          "<td>" + escapeHtml(param.description || "") + "</td>" +
          "<td>" + escapeHtml(param.schema && param.schema.example !== undefined ? param.schema.example : "") + "</td>" +
        "</tr>"
      ).join("");

      return (
        '<div class="section">' +
          "<h4>Parameters</h4>" +
          '<div class="table-wrap">' +
            "<table>" +
              "<thead>" +
                "<tr>" +
                  "<th>Name</th>" +
                  "<th>In</th>" +
                  "<th>Required</th>" +
                  "<th>Description</th>" +
                  "<th>Example</th>" +
                "</tr>" +
              "</thead>" +
              "<tbody>" + rows + "</tbody>" +
            "</table>" +
          "</div>" +
        "</div>"
      );
    };

    const renderExampleBlock = (title, value, open) => {
      if (value === null || value === undefined) return "";
      return (
        "<details" + (open ? " open" : "") + ">" +
          "<summary>" + escapeHtml(title) + "</summary>" +
          "<pre>" + escapeHtml(pretty(value)) + "</pre>" +
        "</details>"
      );
    };

    const renderRequest = (requestBody) => {
      if (!requestBody) return "";
      const content = requestBody.content || {};
      const firstType = Object.keys(content)[0] || "";
      const example = exampleFromContent(content);
      return (
        '<div class="section">' +
          "<h4>Request Body</h4>" +
          '<div class="meta">' +
            '<span class="chip">' + escapeHtml(firstType || "request body") + "</span>" +
          "</div>" +
          '<div class="sections">' +
            renderExampleBlock("Request example", example, true) +
          "</div>" +
        "</div>"
      );
    };

    const renderResponses = (responses) => {
      if (!responses) return "";
      const primary = responses["200"] || Object.values(responses)[0];
      if (!primary) return "";
      const content = primary.content || {};
      const example = exampleFromContent(content);
      let examples = "";
      const media = content["application/json"] || Object.values(content)[0];
      if (media && media.examples) {
        examples = Object.entries(media.examples).map((entry, index) =>
          renderExampleBlock(entry[0], entry[1].value, index === 0)
        ).join("");
      } else {
        examples = renderExampleBlock("Response example", example, true);
      }

      const typeChips = Object.keys(content).length
        ? '<div class="meta">' + Object.keys(content).map((type) => '<span class="chip">' + escapeHtml(type) + "</span>").join("") + "</div>"
        : "";

      return (
        '<div class="section">' +
          "<h4>Responses</h4>" +
          typeChips +
          '<div class="sections">' + examples + "</div>" +
        "</div>"
      );
    };

    const renderAuthGuide = (guide) => {
      if (!guide) return "";

      const header = guide.header || {};
      const tokenEndpoints = Array.isArray(guide.tokenEndpoints) ? guide.tokenEndpoints : [];
      const rules = Array.isArray(guide.rules) ? guide.rules : [];
      const exceptions = Array.isArray(guide.exceptions) ? guide.exceptions : [];

      const renderBulletList = (items) => {
        if (!items.length) return "";
        return '<ul class="auth-list">' + items.map((item) => "<li>" + escapeHtml(item) + "</li>").join("") + "</ul>";
      };

      const endpointRows = tokenEndpoints.map((item) =>
        "<tr>" +
          "<td><code>" + escapeHtml(item.method || "") + "</code></td>" +
          "<td><code>" + escapeHtml(item.path || "") + "</code></td>" +
          "<td>" + escapeHtml(item.description || "") + "</td>" +
        "</tr>"
      ).join("");

      const exceptionRows = exceptions.map((item) =>
        "<tr>" +
          "<td><code>" + escapeHtml(item.path || "") + "</code></td>" +
          "<td>" + escapeHtml(item.description || "") + "</td>" +
        "</tr>"
      ).join("");

      return (
        '<section class="card">' +
          '<div class="card-head">' +
            '<span class="chip">Authentication</span>' +
          "</div>" +
          '<h3 class="summary">' + escapeHtml(guide.title || "Authentication") + "</h3>" +
          '<p class="description">' + escapeHtml(guide.summary || "") + "</p>" +
          '<div class="sections">' +
            '<div class="section">' +
              "<h4>Header</h4>" +
              '<div class="auth-grid">' +
                '<div class="table-wrap"><table><tbody>' +
                  "<tr><th>Name</th><td><code>" + escapeHtml(header.name || "") + "</code></td></tr>" +
                  "<tr><th>Type</th><td>" + escapeHtml(header.type || "") + "</td></tr>" +
                  "<tr><th>Description</th><td>" + escapeHtml(header.description || "") + "</td></tr>" +
                "</tbody></table></div>" +
              "</div>" +
            "</div>" +
            '<div class="section">' +
              "<h4>How to obtain a token</h4>" +
              '<div class="table-wrap">' +
                "<table>" +
                  "<thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>" +
                  "<tbody>" + endpointRows + "</tbody>" +
                "</table>" +
              "</div>" +
            "</div>" +
            '<div class="section">' +
              "<h4>Rules</h4>" +
              renderBulletList(rules) +
            "</div>" +
            '<div class="section">' +
              "<h4>Exceptions</h4>" +
              '<div class="table-wrap">' +
                "<table>" +
                  "<thead><tr><th>Path</th><th>Description</th></tr></thead>" +
                  "<tbody>" + exceptionRows + "</tbody>" +
                "</table>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</section>"
      );
    };

    const renderCard = (operation) => {
      const chips = [];
      if (operation.tag) chips.push('<span class="chip">' + escapeHtml(operation.tag) + "</span>");
      if (operation.auth) chips.push('<span class="chip">Auth required</span>');
      if (operation.admin) chips.push('<span class="chip">Admin only</span>');
      const errorCodes = operation.errorCodes || [];
      if (errorCodes.length) {
        chips.push('<span class="chip">Errors: ' + escapeHtml(errorCodes.join(", ")) + "</span>");
      }

      return (
        '<article class="card" id="' + escapeHtml(operation.anchor) + '" data-search="' + escapeHtml(operation.searchText) + '">' +
          '<div class="card-head">' +
            '<span class="method ' + escapeHtml(methodClass(operation.method)) + '">' + escapeHtml(operation.method) + "</span>" +
            '<code class="path">' + escapeHtml(operation.path) + "</code>" +
          "</div>" +
          '<h3 class="summary">' + escapeHtml(operation.summary) + "</h3>" +
          '<p class="description">' + escapeHtml(operation.description || "") + "</p>" +
          '<div class="meta">' + chips.join("") + "</div>" +
          '<div class="sections">' +
            renderSecurity(operation) +
            renderParams(operation.parameters) +
            renderRequest(operation.requestBody) +
            renderResponses(operation.responses) +
          "</div>" +
        "</article>"
      );
    };

    const renderSecurity = (operation) => {
      if (!operation.auth && !operation.admin) return "";

      const notes = [];
      if (operation.auth) {
        notes.push("Send the session token in the x-cicada-token header unless the endpoint description says otherwise.");
      }
      if (operation.admin) {
        notes.push("This endpoint also requires an authenticated user with admin = 1.");
      }

      return (
        '<div class="section">' +
          "<h4>Security</h4>" +
          '<div class="meta">' +
            (operation.auth ? '<span class="chip">Auth required</span>' : "") +
            (operation.admin ? '<span class="chip">Admin only</span>' : "") +
          "</div>" +
          '<div class="sections">' +
            '<ul class="auth-list">' +
              notes.map((note) => "<li>" + escapeHtml(note) + "</li>").join("") +
            "</ul>" +
          "</div>" +
        "</div>"
      );
    };

    const buildOperations = (spec) => {
      const operations = [];
      const paths = spec.paths || {};

      Object.entries(paths).forEach((pathEntry) => {
        const path = pathEntry[0];
        const pathItem = pathEntry[1];
        methodOrder.forEach((method) => {
          const operation = pathItem[method];
          if (!operation) return;
          const tag = (operation.tags || [])[0] || "Other";
          const anchor = (method + "-" + path).replace(/[^a-z0-9]+/gi, "-").toLowerCase();
          operations.push({
            anchor: anchor,
            method: method.toUpperCase(),
            path: path,
            tag: tag,
            summary: operation.summary || path,
            description: operation.description || "",
            auth: Boolean(operation["x-cicada-auth"]),
            admin: Boolean(operation["x-cicada-admin"]),
            errorCodes: operation["x-cicada-errorCodes"] || [],
            parameters: operation.parameters || [],
            requestBody: operation.requestBody || null,
            responses: operation.responses || null,
            searchText: [tag, path, operation.summary, operation.description].filter(Boolean).join(" ").toLowerCase(),
          });
        });
      });

      return operations;
    };

    const renderNav = (operations) => {
      const grouped = new Map();
      operations.forEach((operation) => {
        if (!grouped.has(operation.tag)) grouped.set(operation.tag, []);
        grouped.get(operation.tag).push(operation);
      });

      return Array.from(grouped.entries()).map((entry) => {
        const tag = entry[0];
        const items = entry[1];
        return (
          '<section class="nav-tag">' +
            "<h2>" + escapeHtml(tag) + "</h2>" +
            '<div class="nav-list">' +
              items.map((operation) =>
                '<a class="nav-item" href="#' + escapeHtml(operation.anchor) + '">' +
                  '<span class="nav-summary">' + escapeHtml(operation.summary) + "</span>" +
                  '<span class="nav-path">' + escapeHtml(operation.path) + "</span>" +
                  '<span class="nav-meta">' +
                    (operation.auth ? '<span class="nav-badge">Auth</span>' : "") +
                    (operation.admin ? '<span class="nav-badge">Admin</span>' : "") +
                  "</span>" +
                "</a>"
              ).join("") +
            "</div>" +
          "</section>"
        );
      }).join("");
    };

    const applyFilter = (value) => {
      const query = value.trim().toLowerCase();
      const cards = Array.from(document.querySelectorAll(".card"));
      let visible = 0;
      cards.forEach((card) => {
        const match = !query || card.dataset.search.includes(query);
        card.classList.toggle("hidden", !match);
        if (match) visible += 1;
      });

      document.querySelectorAll(".nav-tag").forEach((section) => {
        const links = Array.from(section.querySelectorAll(".nav-item"));
        const hasVisible = links.some((link) => {
          const target = document.getElementById(link.getAttribute("href").slice(1));
          return target && !target.classList.contains("hidden");
        });
        section.classList.toggle("hidden", !hasVisible);
      });

      const status = document.getElementById("status");
      status.textContent = query
        ? String(visible) + " matching endpoint" + (visible === 1 ? "" : "s")
        : String(visible) + " documented endpoints";
    };

    const init = async () => {
      const nav = document.getElementById("nav");
      const authGuide = document.getElementById("auth-guide");
      const cards = document.getElementById("cards");
      const heroCopy = document.getElementById("hero-copy");
      const status = document.getElementById("status");

      try {
        const response = await fetch("/apidoc/openapi.json");
        if (!response.ok) throw new Error("HTTP " + response.status);
        const spec = await response.json();
        const operations = buildOperations(spec);

        heroCopy.textContent = spec.info && spec.info.description
          ? spec.info.description
          : "OpenAPI reference for the current service.";
        status.textContent = String(operations.length) + " documented endpoints";

        authGuide.innerHTML = renderAuthGuide(spec["x-cicada-authentication"]);
        nav.innerHTML = renderNav(operations);
        cards.innerHTML = operations.length
          ? operations.map(renderCard).join("")
          : '<div class="empty">No operations were found in the OpenAPI document.</div>';

        document.getElementById("search").addEventListener("input", (event) => {
          applyFilter(event.target.value);
        });
      } catch (error) {
        heroCopy.textContent = "The OpenAPI document could not be loaded.";
        status.textContent = error instanceof Error ? error.message : String(error);
        authGuide.innerHTML = "";
        cards.innerHTML = '<div class="empty">Failed to load the OpenAPI document.</div>';
      }
    };

    init();
  </script>
</body>
</html>
`
