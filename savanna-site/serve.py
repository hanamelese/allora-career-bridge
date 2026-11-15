import http.server
import socketserver
import os

PORT = 8080

class SPARequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Route any /referrals/<token> path to /referrals/index.html
        if self.path.startswith('/referrals/') and not os.path.exists(self.translate_path(self.path)):
            self.path = '/referrals/index.html'
        return super().do_GET()

with socketserver.TCPServer(("127.0.0.1", PORT), SPARequestHandler) as httpd:
    print(f"Serving Savanna SPA on http://localhost:{PORT}")
    httpd.serve_forever()