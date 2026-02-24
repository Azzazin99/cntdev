import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import json
import datetime
import csv
import os

# ================= CONFIGURATION =================
# 1. ท่านต้องไปดาวน์โหลด Service Account Key (JSON) มาจาก Firebase Console
#    (Settings -> Service Accounts -> Generate new private key)
#    แล้วเอาไฟล์มาวางที่นี่ ตั้งชื่อว่า "serviceAccountKey.json"
KEY_PATH = "serviceAccountKey.json"

# ================= SETUP =================
def initialize_firebase():
    if not os.path.exists(KEY_PATH):
        print(f"❌ Error: ไม่พบไฟล์คีย์ '{KEY_PATH}'")
        print("วิธีเอาคีย์: ไปที่ Firebase Console -> Project Settings -> Service accounts -> Generate new private key")
        return None

    try:
        cred = credentials.Certificate(KEY_PATH)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("✅ เชื่อมต่อ Firebase สำเร็จ!")
        return db
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return None

def parse_thai_date_to_timestamp(date_str):
    # Helper to convert "24 มกราคม 2568" to timestamp for sorting
    try:
        months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", 
                  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]
        parts = date_str.split()
        if len(parts) < 3: return 0
        d = int(parts[0])
        m_str = parts[1]
        y_be = int(parts[2])
        
        m = months.index(m_str) + 1
        y_ad = y_be - 543
        
        dt = datetime.datetime(y_ad, m, d)
        return dt.timestamp() * 1000 # milliseconds
    except:
        return 0

def upload_json(db):
    json_path = 'assets/data/news.json'
    if not os.path.exists(json_path):
        print("⚠️ ไม่พบไฟล์ news.json ข้ามการอัปโหลด JSON")
        return

    print(f"\nกำลังอ่านไฟล์ {json_path}...")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    batch = db.batch()
    count = 0
    
    collection_ref = db.collection('news')

    for item in data:
        doc_id = str(item.get('id', datetime.datetime.now().timestamp()))
        
        # Ensure SortOrder exists
        if 'sortOrder' not in item or not item['sortOrder']:
            item['sortOrder'] = parse_thai_date_to_timestamp(item.get('date', ''))

        doc_ref = collection_ref.document(doc_id)
        batch.set(doc_ref, item)
        count += 1

        if count % 400 == 0: # Firestore batch limit is 500
            batch.commit()
            print(f"   ...บันทึกแล้ว {count} รายการ")
            batch = db.batch()

    if count > 0:
        batch.commit()
        print(f"✅ อัปโหลด JSON เสร็จสิ้น: {count} รายการ")
    else:
        print("⚠️ ไม่มีข้อมูลในไฟล์ JSON")

def upload_csv(db):
    csv_path = 'pr_news.csv'
    if not os.path.exists(csv_path):
        print("⚠️ ไม่พบไฟล์ pr_news.csv ข้ามการอัปโหลด CSV")
        return

    print(f"\nกำลังอ่านไฟล์ {csv_path}...")
    news_list = []
    
    # Reuse logic from import_news.py but adapt for Firestore
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Map columns (Adjust based on your CSV headers)
            # Assuming headers: 'ประทับเวลา', 'หัวข้อข่าว', 'Link'
            timestamp = row.get('ประทับเวลา', '')
            title = row.get('หัวข้อข่าว', '')
            link = row.get('Link', '')

            # Format Date (Naive implementation, better to reuse existing logic if robust)
            # For now, let's assume the CSV data needs formatting or just use string
            # We skip complex formatting here to keep it simple, or paste function if needed
            
            # Create Item
            if title:
                item_id = str(int(datetime.datetime.now().timestamp() * 1000)) + str(len(news_list))
                item = {
                    "id": item_id,
                    "title": title,
                    "link": link,
                    "date": timestamp, # You might want to format this
                    "category": "news",
                    "image": "",
                    "sortOrder": 0 # TODO: Parse timestamp
                }
                news_list.append(item)

    # Batch Upload
    # ... logic similar to JSON upload ...
    # For now, let's focus on JSON since your import_news.py already made a good JSON
    print("ℹ️ Note: ระบบแนะนำให้แปลง CSV เป็น JSON ด้วย import_news.py ก่อน แล้วค่อยอัปโหลด JSON จะชัวร์กว่าครับ")


def upload_activities_json(db):
    json_path = 'assets/data/activities.json'
    if not os.path.exists(json_path):
        print("⚠️ ไม่พบไฟล์ activities.json ข้ามการอัปโหลด Activities")
        return

    print(f"\nกำลังอ่านไฟล์ {json_path}...")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    batch = db.batch()
    count = 0
    
    collection_ref = db.collection('activities')

    for item in data:
        doc_id = str(item.get('id', datetime.datetime.now().timestamp()))
        
        # Ensure SortOrder exists
        if 'sortOrder' not in item or not item['sortOrder']:
            item['sortOrder'] = parse_thai_date_to_timestamp(item.get('date', ''))

        doc_ref = collection_ref.document(doc_id)
        batch.set(doc_ref, item)
        count += 1

        if count % 400 == 0:
            batch.commit()
            print(f"   ...บันทึก Activities แล้ว {count} รายการ")
            batch = db.batch()

    if count > 0:
        batch.commit()
        print(f"✅ อัปโหลด Activities เสร็จสิ้น: {count} รายการ")
    else:
        print("⚠️ ไม่มีข้อมูลในไฟล์ Activities")


def upload_site_data(db, list_key):
    json_path = f'assets/data/{list_key}.json'
    if not os.path.exists(json_path):
        return

    print(f"\nกำลังอ่านไฟล์ {json_path}...")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Generic lists are saved as a single document with an 'items' array
    doc_ref = db.collection('site_data').document(list_key)
    doc_ref.set({'items': data})
    print(f"✅ อัปโหลด {list_key} เสร็จสิ้น: {len(data)} รายการ")

if __name__ == "__main__":
    confirm = input("ยืนยันจะอัปโหลดข้อมูล (News + Activities + Personnel) ขึ้น Firebase (y/n)? ")
    if confirm.lower() == 'y':
        db = initialize_firebase()
        if db:
            upload_json(db)     # Upload News
            upload_activities_json(db) # Upload Activities
            upload_site_data(db, 'personnel') # Upload Personnel

            upload_site_data(db, 'forms')     # Upload Forms
            upload_site_data(db, 'manuals')   # Upload Work Manuals
            upload_site_data(db, 'plans')     # Upload Dev Plans
            # upload_csv(db) 
            print("\n🎉 เสร็จสิ้นภารกิจ! ลอง Refresh หน้าเว็บดูได้เลย")
