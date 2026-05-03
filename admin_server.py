
import http.server
import socketserver
import json
import os
import datetime
from urllib.parse import urlparse, parse_qs
import cgi
import shutil

PORT = 4289
DATA_FILE = 'assets/data/news.json'
IMAGE_DIR = 'assets/images/news/'

class AdminHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/upload':
            try:
                # 1. Parse Multipart Form Handler
                form = cgi.FieldStorage(
                    fp=self.rfile,
                    headers=self.headers,
                    environ={'REQUEST_METHOD': 'POST'}
                )

                # 2. Get Form Data
                title = form.getvalue('title')
                category = form.getvalue('category')
                summary = form.getvalue('summary')
                date_str = form.getvalue('date') # Format YYYY-MM-DD
                
                # Convert Date format from YYYY-MM-DD to DD Month YYYY (Thai) if needed
                # For now, let's keep simplistic or do simple mapping
                formatted_date = self.format_thai_date(date_str)

                # 3. Handle Image Upload
                image_path = ""
                if 'image' in form and form['image'].filename:
                    image_file = form['image']
                    original_filename = os.path.basename(image_file.filename)
                    # Create unique filename: timestamp_filename
                    timestamp = int(datetime.datetime.now().timestamp())
                    new_filename = f"{timestamp}_{original_filename}"
                    save_path = os.path.join(IMAGE_DIR, new_filename)
                    
                    # Ensure directory exists
                    os.makedirs(IMAGE_DIR, exist_ok=True)
                    
                    # Write file
                    with open(save_path, 'wb') as f:
                        f.write(image_file.file.read())
                    
                    image_path = f"{IMAGE_DIR}{new_filename}"
                else:
                    # Default image if none uploaded (e.g. for News)
                    image_path = "assets/images/logos/moe.png"

                # 4. Update JSON Data
                new_entry = {
                    "id": int(datetime.datetime.now().timestamp() * 1000),
                    "date": formatted_date,
                    "title": title,
                    "category": category,
                    "summary": summary,
                    "image": image_path,
                    "link": "#", # Todo: Generate detail page link or use a placeholder
                    "facebookLink": "",
                    "content": "",
                    "gallery": []
                }
                
                # Read existing data
                current_data = []
                if os.path.exists(DATA_FILE):
                    with open(DATA_FILE, 'r', encoding='utf-8') as f:
                        current_data = json.load(f)
                
                # Append new entry (beginning or end? usually newest first)
                current_data.insert(0, new_entry) # Add to top
                
                # Save back
                with open(DATA_FILE, 'w', encoding='utf-8') as f:
                    json.dump(current_data, f, ensure_ascii=False, indent=4)

                # 5. Respond
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {"status": "success", "message": "บันทึกข้อมูลเรียบร้อยแล้ว!"}
                self.wfile.write(json.dumps(response).encode('utf-8'))

            except Exception as e:
                print(f"Error: {e}")
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        
        elif self.path == '/api/save-data':
            try:
                # 1. Read Content-Length
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                payload = json.loads(post_data.decode('utf-8'))

                filename = payload.get('filename')
                data = payload.get('data')

                # 2. Validation
                if not filename or not filename.endswith('.json'):
                    raise ValueError("Invalid filename")
                
                # Security: Prevent directory traversal
                if '..' in filename or '/' in filename:
                    raise ValueError("Invalid path")

                # 3. Save File
                file_path = os.path.join('assets/data', filename)
                
                # Ensure directory exists
                os.makedirs('assets/data', exist_ok=True)
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=4)

                # 4. Success Response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {"status": "success", "message": f"Saved {filename}"}
                self.wfile.write(json.dumps(response).encode('utf-8'))

            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))

        elif self.path == '/api/download-image':
            try:
                import urllib.request
                import re
                
                # 1. Read JSON payload
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                payload = json.loads(post_data.decode('utf-8'))

                image_url = payload.get('url')
                
                if not image_url:
                    raise ValueError("No URL provided")
                
                # 2. Generate safe filename
                timestamp = int(datetime.datetime.now().timestamp())
                # Try to extract extension from URL
                ext = '.jpg'
                if '.png' in image_url.lower():
                    ext = '.png'
                elif '.gif' in image_url.lower():
                    ext = '.gif'
                elif '.webp' in image_url.lower():
                    ext = '.webp'
                
                filename = f"activity_{timestamp}{ext}"
                save_dir = 'assets/images/activity'
                save_path = os.path.join(save_dir, filename)
                
                # 3. Ensure directory exists
                os.makedirs(save_dir, exist_ok=True)
                
                # 4. Download image
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
                request = urllib.request.Request(image_url, headers=headers)
                with urllib.request.urlopen(request, timeout=30) as response:
                    with open(save_path, 'wb') as f:
                        f.write(response.read())
                
                # 5. Return the local path
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {
                    "status": "success", 
                    "localPath": save_path,
                    "message": f"ดาวน์โหลดรูปสำเร็จ: {filename}"
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))

            except Exception as e:
                print(f"Download Error: {e}")
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))

        else:
            self.send_error(404, "Endpoint not found")

    def format_thai_date(self, date_str):
        if not date_str:
            return ""
        # Input YYYY-MM-DD
        year, month, day = date_str.split('-')
        thai_months = [
            "", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
            "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
        ]
        thai_year = int(year) + 543
        month_name = thai_months[int(month)]
        # Remove leading zero from day
        day = str(int(day))
        
        return f"{day} {month_name} {thai_year}"

# Enable simple serving of current directory for the frontend
print(f"Admin Server running at http://localhost:{PORT}")
print(f"Open http://localhost:{PORT}/admin.html to manage content")

with socketserver.TCPServer(("", PORT), AdminHandler) as httpd:
    httpd.serve_forever()
