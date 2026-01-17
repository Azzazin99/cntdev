import csv
import json
import datetime

# Thai Month Mapping
THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
]

def format_date_thai(date_str):
    # Input format: "24/12/2025, 9:32:50" or "D/M/YYYY..."
    try:
        # Split date and time if comma exists
        date_part = date_str.split(',')[0].strip()
        day, month, year = map(int, date_part.split('/'))
        
        # Convert to Buddhist Year
        be_year = year + 543
        thai_month = THAI_MONTHS[month - 1]
        
        return f"{day} {thai_month} {be_year}"
    except Exception as e:
        print(f"Error parsing date: {date_str} - {e}")
        return date_str

def main():
    # 1. Read CSV
    new_items = []
    with open('pr_news.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            timestamp = row['ประทับเวลา']
            title = row['หัวข้อข่าว']
            link = row['Link']
            # File upload column seems unused or secondary link, ignore for now unless link is empty
            
            formatted_date = format_date_thai(timestamp)
            
            item = {
                "id": str(datetime.datetime.now().timestamp()).replace('.', '') + str(len(new_items)), # distinctive ID
                "date": formatted_date,
                "title": title,
                "category": "news",
                "summary": title, # Use title as summary for now
                "image": "assets/images/logos/moc.png", # Placeholder image (Ministry logo or similar if avail, else generic)
                "link": link,
                "facebookLink": "",
                "content": "",
                "gallery": []
            }
            new_items.append(item)

    # 2. Reverse list (CSV is Newest -> Oldest, we want Oldest -> Newest for JSON/UI logic)
    new_items.reverse()
    
    # 3. Load existing JSON
    json_path = 'assets/data/news.json'
    with open(json_path, 'r', encoding='utf-8') as f:
        existing_data = json.load(f)
        
    # 4. Append
    # Check for duplicates? title + date
    existing_keys = set((i['title'], i['date']) for i in existing_data)
    
    added_count = 0
    for item in new_items:
        key = (item['title'], item['date'])
        if key not in existing_keys:
            existing_data.append(item)
            added_count += 1
            
    # 5. Save
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, ensure_ascii=False, indent=4)
        
    print(f"Successfully added {added_count} new items.")

if __name__ == "__main__":
    main()
