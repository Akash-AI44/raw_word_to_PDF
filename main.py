from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path


class MyHandler(BaseHTTPRequestHandler):

    def do_GET(self):

        if self.path == "/":

            file_path = Path("static") / "index.html"

            html = file_path.read_bytes()

            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()

            self.wfile.write(html)
        else:
            self.send_error(404, message="404 Not Found", explain=None)


server = HTTPServer(("127.0.0.1", 8000), MyHandler)

print("Server running at http://127.0.0.1:8000")

server.serve_forever()
