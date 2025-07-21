import requests
import json
import csv
from io import StringIO

# URLs for data sources (updated paths)
GEO_URL = 'https://raw.githubusercontent.com/openbibleinfo/Bible-Geocoding-Data/main/data/modern.jsonl'  # Places with coords
REL_URL = 'https://raw.githubusercontent.com/BradyStephenson/bible-data/main/BibleData-PersonRelationship.csv'  # Relationships
PERSON_URL = 'https://raw.githubusercontent.com/BradyStephenson/bible-data/main/BibleData-Person.csv'  # Person details

# Fetch function
def fetch_data(url):
    response = requests.get(url)
    response.raise_for_status()
    return response.text

# Parse geo data (JSONL to dict: name -> {lat, lng, details})
geo_data = {}
geo_text = fetch_data(GEO_URL)
for line in geo_text.splitlines():
    place = json.loads(line)
    name = place.get('name', '').lower()
    coords = place.get('coordinates')
    if name and coords:
        geo_data[name] = {'lat': coords[1], 'lng': coords[0], 'details': place.get('description', '')}

# Parse relationships (CSV: build simple trees/ancestors/progenitors)
relationships = {}
rel_text = fetch_data(REL_URL)
csv_reader = csv.DictReader(StringIO(rel_text))
for row in csv_reader:
    person_id_1 = row['person_id_1']
    rel_type = row['relationship_type']
    person_id_2 = row['person_id_2']
    if person_id_1 not in relationships:
        relationships[person_id_1] = {'ancestors': [], 'progenitors': []}
    if person_id_2 not in relationships:
        relationships[person_id_2] = {'ancestors': [], 'progenitors': []}
    # Handle parent-to-child types (person1 -> person2)
    if rel_type in ['father', 'mother']:
        relationships[person_id_1]['progenitors'].append(person_id_2)
        relationships[person_id_2]['ancestors'].append(person_id_1)
    # Handle child-to-parent types (person1 -> person2), if present
    elif rel_type in ['son', 'daughter']:
        relationships[person_id_1]['ancestors'].append(person_id_2)
        relationships[person_id_2]['progenitors'].append(person_id_1)
    # Skip other types (e.g., sibling, spouse) for now, or add logic if needed

# Parse persons (CSV: id -> name, details, etc.)
persons = {}
person_text = fetch_data(PERSON_URL)

print(person_text)

exit()

csv_reader = csv.DictReader(StringIO(person_text))
for row in csv_reader:
    id = row['person_id']
    name = row['person_name']
    sex = row.get('sex', '')
    tribe = row.get('tribe', '')
    notes = row.get('person_notes', '')
    unique_attr = row.get('unique_attribute', '')
    details = unique_attr + ' ' + notes
    if sex or tribe:
        details += f" Sex: {sex}. Tribe: {tribe}."
    persons[id] = {
        'name': name,
        'details': details.strip(),
        'age': None,  # Not present in this dataset
        'verses': []  # Not present; see PersonVerse.csv for mentions
    }

# Build entries (limit to 100 for example; match geo where possible)
entries = []

for id, person in list(persons.items())[:100]:  # Adjust limit
    rel = relationships.get(id, {'ancestors': [], 'progenitors': []})
    ancestors = ', '.join(persons.get(a, {}).get('name', 'Unknown') for a in rel['ancestors'])
    progenitors = ', '.join(persons.get(p, {}).get('name', 'Unknown') for p in rel['progenitors'])
    name_lower = person['name'].lower()
    geo = geo_data.get(name_lower) or next((geo_data[k] for k in geo_data if name_lower in k), None)
    lat, lng = (geo['lat'], geo['lng']) if geo else (0.0, 0.0)  # Default if no match
    family_tree = f"{person['name']}\n" + '\n'.join(f"└─ {p}" for p in progenitors.split(', '))  # Simple tree
    color = 'blue' if 'flood' in person['details'].lower() else 'green'  # Example coloring

    entries.append({
        'name': person['name'],
        'lat': lat,
        'lng': lng,
        'ancestors': ancestors or 'Unknown',
        'progenitors': progenitors or 'Unknown',
        'details': person['details'],
        'age': person['age'],
        'familyTree': family_tree,
        'verses': person['verses'],
        'color': color
    })

# Output TS file content
print('interface BiblicalEntry {')
print('  name: string;')
print('  lat: number;')
print('  lng: number;')
print('  ancestors: string;')
print('  progenitors: string;')
print('  details: string;')
print('  age?: number;')
print('  familyTree: string;')
print('  verses: string[];')
print('  color: string;')
print('}')
print('export const biblicalData: BiblicalEntry[] = [')
for entry in entries:
    print(json.dumps(entry, indent=2) + ',')
print('];')