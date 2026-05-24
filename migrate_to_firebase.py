"""
Upload static JSON data to Firestore (project cntdev-e49f5).

Credentials (pick one):
  - serviceAccountKey.json in project root
  - FIREBASE_SERVICE_ACCOUNT_JSON env var (same as Vercel / .env.local)

Data source: static/assets/data/*.json
"""
import datetime
import json
import os
import sys

import firebase_admin
from firebase_admin import credentials, firestore

DATA_DIR = os.path.join("static", "assets", "data")
KEY_PATH = "serviceAccountKey.json"

SITE_DATA_KEYS = [
    "manuals",
    "knowledge",
    "plans",
    "forms",
    "authority",
    "personnel",
]


def load_credentials():
    env_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
    if env_json:
        try:
            return credentials.Certificate(json.loads(env_json))
        except json.JSONDecodeError as e:
            print(f"❌ Invalid FIREBASE_SERVICE_ACCOUNT_JSON: {e}")
            return None

    if os.path.exists(KEY_PATH):
        return credentials.Certificate(KEY_PATH)

    print("❌ No credentials found.")
    print("   Place serviceAccountKey.json in project root, or set FIREBASE_SERVICE_ACCOUNT_JSON.")
    print("   Firebase Console → cntdev-e49f5 → Service accounts → Generate new private key")
    return None


def initialize_firebase():
    cred = load_credentials()
    if not cred:
        return None
    try:
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("✅ Connected to Firestore")
        return db
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return None


def parse_thai_date_to_timestamp(date_str):
    try:
        months = [
            "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
            "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
        ]
        parts = date_str.split()
        if len(parts) < 3:
            return 0
        d = int(parts[0])
        m_str = parts[1]
        y_be = int(parts[2])
        m = months.index(m_str) + 1
        y_ad = y_be - 543
        dt = datetime.datetime(y_ad, m, d)
        return dt.timestamp() * 1000
    except Exception:
        return 0


def data_path(filename):
    return os.path.join(DATA_DIR, filename)


def upload_collection(db, collection_name, json_filename):
    json_path = data_path(json_filename)
    if not os.path.exists(json_path):
        print(f"⚠️  Skip {collection_name}: missing {json_path}")
        return

    print(f"\nUploading {collection_name} from {json_path}...")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        print(f"⚠️  Skip {collection_name}: expected JSON array")
        return

    batch = db.batch()
    count = 0
    collection_ref = db.collection(collection_name)

    for item in data:
        doc_id = str(item.get("id", datetime.datetime.now().timestamp()))
        if "sortOrder" not in item or not item["sortOrder"]:
            item["sortOrder"] = parse_thai_date_to_timestamp(item.get("date", ""))

        batch.set(collection_ref.document(doc_id), item)
        count += 1

        if count % 400 == 0:
            batch.commit()
            print(f"   ...{count} documents")
            batch = db.batch()

    if count > 0:
        batch.commit()
        print(f"✅ {collection_name}: {count} documents")
    else:
        print(f"⚠️  {collection_name}: empty file")


def upload_certificates_config(db):
    json_path = os.path.join(DATA_DIR, "certificates_config.json")
    if not os.path.exists(json_path):
        print("⚠️  Skip certificates_config: missing file")
        return

    print(f"\nUploading site_data/certificates_config from {json_path}...")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    db.collection("site_data").document("certificates_config").set(data)
    print("✅ site_data/certificates_config uploaded")


def upload_site_data(db, list_key):
    json_path = data_path(f"{list_key}.json")
    if not os.path.exists(json_path):
        print(f"⚠️  Skip site_data/{list_key}: missing {json_path}")
        return

    print(f"\nUploading site_data/{list_key} from {json_path}...")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        print(f"⚠️  Skip site_data/{list_key}: expected JSON array")
        return

    db.collection("site_data").document(list_key).set({"items": data})
    print(f"✅ site_data/{list_key}: {len(data)} items")


def main():
    auto = "--yes" in sys.argv or "-y" in sys.argv
    if not auto:
        confirm = input(
            "Upload news, activities, and site_data (manuals, knowledge, plans, "
            "forms, authority, personnel) to Firestore? (y/n): "
        )
        if confirm.lower() != "y":
            print("Cancelled.")
            return

    db = initialize_firebase()
    if not db:
        sys.exit(1)

    upload_collection(db, "news", "news.json")
    upload_collection(db, "activities", "activities.json")

    for key in SITE_DATA_KEYS:
        upload_site_data(db, key)

    upload_certificates_config(db)

    print("\nDone. Verify in Firebase Console → Firestore.")
    print("Set FIREBASE_SERVICE_ACCOUNT_JSON in .env.local and Vercel, then restart dev / redeploy.")


if __name__ == "__main__":
    main()
