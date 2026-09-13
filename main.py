from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path


class MyHandler(BaseHTTPRequestHandler):

    def do_GET(self):

        if self.path == "/":
            file_path = Path("static/index.html")
            self.send_file(file_path, "text/html")

        elif self.path == "/style.css":
            file_path = Path("static/style.css")
            self.send_file(file_path, "text/css")

        elif self.path == "/script.js":
            file_path = Path("static/script.js")
            self.send_file(file_path, "application/javascript")

        else:
            self.send_error(404)

    def send_file(self, file_path, content_type):

        if not file_path.exists():
            self.send_error(404)
            return

        content = file_path.read_bytes()

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.end_headers()

        self.wfile.write(content)


server = HTTPServer(("127.0.0.1", 8000), MyHandler)

print("Server running at http://127.0.0.1:8000")

server.serve_forever()
