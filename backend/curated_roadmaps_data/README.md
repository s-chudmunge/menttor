# Curated Roadmaps Data

This folder contains static JSON files with curated roadmaps data for fast loading.

## Usage

1. Generate and download the latest data from the admin panel (`/admin/curated-roadmaps`)
2. Place the downloaded JSON file in this directory
3. The explore page will automatically use the static data instead of making database queries

## File Format

The JSON file should contain:
```json
{
  "generated_at": "ISO timestamp",
  "total_roadmaps": "number of roadmaps",
  "roadmaps": [...], // array of roadmap objects
  "categories": {...} // category data structure
}
```

## Benefits

- Faster page load times
- Reduced database load
- Better caching capabilities
- Improved user experience

## Note

Make sure to regenerate and update this file whenever roadmaps are added or modified in the database.