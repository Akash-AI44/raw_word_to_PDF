from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
import mimetypes
import json
import tempfile


class MyHandler(BaseHTTPRequestHandler):

    def do_GET(self):

        if self.path == "/":
            file_path = Path("static/index.html")
            self.send_file(file_path)

        elif self.path.startswith("/static/"):
            filename = self.path[len("/static/"):]
            file_path = Path("static") / filename
            self.send_file(file_path)

        elif self.path == "/health":
            self.send_json(200, {"status": "ok"})

        else:
            self.send_error(404)

    def do_POST(self):
        if self.path == "/convert":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            filename, file_bytes = parse_multipart(
                body, self.headers.get("Content-Type", ""))
            with tempfile.TemporaryDirectory() as tmp:
                tmp_path = Path(tmp)
                input_path = tmp_path / filename
                input_path.write_bytes(file_bytes)
                print("Saved to:", input_path)
                pdf_path = tmp_path / (input_path.stem + ".pdf")
                try:
                    from docx2pdf import convert
                except ImportError:
                    self.send_json(500, {"error": "docx2pdf is not installed"})
                    return

                try:
                    convert(str(input_path), str(pdf_path))
                    self.send_file(pdf_path)
                except Exception as exc:
                    self.send_json(500, {"error": str(exc)})
            return

        self.send_error(404)

    def send_file(self, file_path):

        if not file_path.exists():
            self.send_error(404)
            return

        content = file_path.read_bytes()

        self.send_response(200)
        content_type, encoding = mimetypes.guess_type(str(file_path))
        self.send_header(
            "Content-Type", content_type or "application/octet-stream")
        self.end_headers()

        self.wfile.write(content)

    def send_json(self, status_code, payload):
        json_bytes = json.dumps(payload).encode()

        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json_bytes)


def parse_multipart(body, content_type):
    boundary = content_type.split("boundary=")[1]
    boundary = boundary.encode()
    parts = body.split(b"--" + boundary)

    for part in parts:
        if b'filename="' in part:
            start = part.find(b'filename="') + len(b'filename="')
            end = part.find(b'"', start)
            filename = part[start:end].decode()
            content_start = part.find(b"\r\n\r\n") + 4
            file_bytes = part[content_start:-2]

            return filename, file_bytes


server = HTTPServer(("127.0.0.1", 8000), MyHandler)

print("Server running at http://127.0.0.1:8000")

server.serve_forever()
