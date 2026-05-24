import http.server
import socketserver
import json
import os
import socket
import sys

DEFAULT_PORT = 6395
# Allow overriding port via environment variable: PORT=3001 python3 server.py
try:
    PORT = int(os.getenv('PORT', str(DEFAULT_PORT)))
except ValueError:
    PORT = DEFAULT_PORT
DATA_FILE = 'assets/data/news.json'

def check_port_available(port):
    """Check if port is available"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(("", port))
            return True
        except OSError:
            return False

if not check_port_available(PORT):
    print(f"❌ Port {PORT} is already in use!")
    print("Please try a different port or stop the process using this port.")
    print(f"To find what process is using this port: lsof -i :{PORT}")
    sys.exit(1)

# Validate working directory and data files
if not os.path.exists('assets/data'):
    print("❌ Creating data directory...")
    os.makedirs('assets/data', exist_ok=True)

if not os.path.exists(DATA_FILE):
    print(f"⚠️ Data file {DATA_FILE} not found. Creating empty structure...")
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f, ensure_ascii=False, indent=4)

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/save-data':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                request_data = json.loads(post_data.decode('utf-8'))
                
                filename = request_data.get('filename')
                data_content = request_data.get('data')

                # Basic security check
                if not filename or '/' in filename or '..' in filename:
                    raise ValueError("Invalid filename")
                
                target_path = os.path.join('assets/data', filename)
                os.makedirs(os.path.dirname(target_path), exist_ok=True)

                with open(target_path, 'w', encoding='utf-8') as f:
                    json.dump(data_content, f, ensure_ascii=False, indent=4)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'success', 'message': f'{filename} saved successfully'}).encode('utf-8'))
                print(f"✅ Successfully saved data to {target_path}")

            except json.JSONDecodeError as je:
                print(f"❌ JSON Decode Error: {str(je)}")
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': 'Invalid JSON format'}).encode('utf-8'))
            except FileNotFoundError as fe:
                print(f"❌ File Error: {str(fe)}")
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': 'File or directory not found'}).encode('utf-8'))
            except Exception as e:
                print(f"❌ Error saving data: {str(e)}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': str(e)}).encode('utf-8'))
        else:
            self.send_error(404, "Endpoint not found")

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

print(f"🚀 CNT Clone Server Running at http://localhost:{PORT}")
print(f"📂 Serving directory: {os.getcwd()}")
print("✨ API Enabled: POST /api/save-data")
print("-" * 50)

with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
    httpd.serve_forever()
