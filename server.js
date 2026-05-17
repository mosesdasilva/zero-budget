const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "simple-budget");
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "zero-budget.json");
const EXAMPLE_FILE = path.join(DATA_DIR, "zero-budget.example.json");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    const starter = await fs.readFile(EXAMPLE_FILE, "utf8");
    await fs.writeFile(DATA_FILE, starter);
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function handleApi(request, response) {
  if (request.url === "/api/budget" && request.method === "GET") {
    await ensureDataFile();
    const data = await fs.readFile(DATA_FILE, "utf8");
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(data);
    return;
  }

  if (request.url === "/api/budget" && request.method === "PUT") {
    await ensureDataFile();
    const body = await readRequestBody(request);
    const parsed = JSON.parse(body);
    const pretty = `${JSON.stringify(parsed, null, 2)}\n`;
    await fs.writeFile(DATA_FILE, pretty);
    sendJson(response, 200, { ok: true });
    return;
  }

  sendJson(response, 404, { error: "Not found" });
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://localhost:${PORT}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const normalized = path.normalize(decodeURIComponent(requestedPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, normalized);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    const contentType = MIME_TYPES[path.extname(filePath)] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(file);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.url.startsWith("/api/")) {
      await handleApi(request, response);
      return;
    }

    await serveStatic(request, response);
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
});

ensureDataFile()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Zero Budget running at http://localhost:${PORT}`);
      console.log(`Budget data file: ${DATA_FILE}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

