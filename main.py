from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
import mimetypes


class MyHandler(BaseHTTPRequestHandler):

    def do_GET(self):

        if self.path == "/":
            file_path = Path("static/index.html")
            self.send_file(file_path)

        elif self.path.startswith("/static/"):
            filename = self.path[len("/static/"):]
            file_path = Path("static") / filename
            self.send_file(file_path)

        else:
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


server = HTTPServer(("127.0.0.1", 8000), MyHandler)

print("Server running at http://127.0.0.1:8000")

server.serve_forever()
