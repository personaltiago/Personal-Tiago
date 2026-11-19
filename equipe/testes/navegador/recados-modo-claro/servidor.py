"""Servidor local mínimo para o teste no Chrome (só 127.0.0.1).
Uso: python3 servidor.py <pasta-com-as-paginas> <pasta-para-capturas> [porta]
Serve a pasta e aceita POST /save?name=arquivo.png (grava o corpo na pasta de capturas)."""
import http.server, os, socketserver, sys, urllib.parse

ROOT = os.path.abspath(sys.argv[1])
OUT = os.path.abspath(sys.argv[2])
PORT = int(sys.argv[3]) if len(sys.argv) > 3 else 8773
os.makedirs(OUT, exist_ok=True)


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)
        if u.path != '/save':
            self.send_error(404)
            return
        name = os.path.basename(urllib.parse.parse_qs(u.query).get('name', ['x.bin'])[0])
        n = int(self.headers.get('Content-Length', '0'))
        data = self.rfile.read(n)
        with open(os.path.join(OUT, name), 'wb') as f:
            f.write(data)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'ok')

    def log_message(self, *a):
        pass


socketserver.TCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(('127.0.0.1', PORT), H) as srv:
    srv.serve_forever()
