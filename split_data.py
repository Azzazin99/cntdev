import json
import os

# Paths
BASE_DIR = 'assets/data'
SOURCE_FILE = os.path.join(BASE_DIR, 'news.json')
NEWS_FILE = os.path.join(BASE_DIR, 'news.json') # Overwrite target
ACTIVITIES_FILE = os.path.join(BASE_DIR, 'activities.json') # New target

def split_data():
    if not os.path.exists(SOURCE_FILE):
        print(f"Error: {SOURCE_FILE} not found.")
        return

    try:
        with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        return

    news_items = []
    activity_items = []

    for item in data:
        category = item.get('category', 'news') # Default to news if missing
        if category == 'activity':
            activity_items.append(item)
        else:
            # Assumes 'news' or undefined is news
            news_items.append(item)

    # Write separate files
    # 1. Activities
    with open(ACTIVITIES_FILE, 'w', encoding='utf-8') as f:
        json.dump(activity_items, f, ensure_ascii=False, indent=4)
    print(f"✅ Created {ACTIVITIES_FILE} with {len(activity_items)} items.")

    # 2. News (Overwrite original)
    with open(NEWS_FILE, 'w', encoding='utf-8') as f:
        json.dump(news_items, f, ensure_ascii=False, indent=4)
    print(f"✅ Updated {NEWS_FILE} with {len(news_items)} items.")

if __name__ == "__main__":
    split_data()
