from http.server import HTTPServer, BaseHTTPRequestHandler


class MyHandler(BaseHTTPRequestHandler):

    def do_GET(self):
        self.send_response(200)

        self.send_header("Content-Type", "text/html")
        self.end_headers()

        self.wfile.write(b"<h1>Hello from my server!</h1>")


server = HTTPServer(("127.0.0.1", 8000), MyHandler)

print("Server running at http://127.0.0.1:8000")

server.serve_forever()
