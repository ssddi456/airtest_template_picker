# Airtest Template Manager

A full-stack web application for managing Airtest automation test screenshots and UI element annotations with version control and automatic Python template file generation.

## Features

- **Screenshot Management**: Upload, view, search, and delete game screenshots
- **Annotation Editor**: Draw rectangle annotations on screenshots to mark UI elements
- **Version Control**: Track annotation history with rollback capability
- **Group Organization**: Organize screenshots into preset groups (login, game_main, gameplay, other)
- **Python Code Generation**: Automatically generate Airtest Template Python code
- **Relative Coordinates**: Store both absolute (pixels) and relative (0-1) coordinates

## Tech Stack

- **Frontend**: React + TypeScript + TailwindCSS + Rspack
- **Backend**: Express.js (Node.js)
- **Storage**: JSON files (no database required)
- **Build Tool**: Rspack

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The application will start on an automatically assigned port (e.g., http://localhost:3000).

## Usage

### 1. Upload Screenshots

- Navigate to the **Screenshots** tab
- Drag and drop image files or click to upload
- Enter a name and select a group
- Click **Choose File or Drop Here**

### 2. Annotate Screenshots

- Click **Annotate** on any screenshot
- Draw rectangles on the image to mark UI elements
- Each rectangle represents a UI element (button, text field, etc.)
- Enter a name for each annotation
- View both absolute (pixels) and relative (0-1) coordinates
- Click **Save Annotations** to save

### 3. Manage Versions

- Navigate to the **Version History** tab
- View all previous versions of annotations
- Click **Rollback** to restore a previous version
- Each save creates a new version

### 4. Generate Python Code

- Navigate to the **Python Code** tab
- Click **Generate Code** to create Python code
- Click **Copy to Clipboard** to copy the code
- Paste into your Airtest test script

### 5. Use in Airtest Tests

```python
from airtest.core.api import *
import Templates

# Use the templates in your test
touch(Templates['Login Button'])
touch(Templates['Game Start Button'])
```

## API Documentation

### Screenshot Endpoints

#### Upload Screenshot
```
POST /api/screenshots
Content-Type: multipart/form-data

- file: Image file
- name: Screenshot name
- group: Group (login | game_main | gameplay | other)

Response: { success: true, data: Screenshot }
```

#### Get All Screenshots
```
GET /api/screenshots?search=<query>

Response: { success: true, data: Screenshot[] }
```

#### Get Single Screenshot
```
GET /api/screenshots/:id

Response: { success: true, data: Screenshot }
```

#### Delete Screenshot
```
DELETE /api/screenshots/:id

Response: { success: true }
```

### Annotation Endpoints

#### Get Annotations
```
GET /api/annotations/:screenshotId

Response: { success: true, data: Annotation[] }
```

#### Save Annotations (Create Version)
```
POST /api/annotations/:screenshotId
Content-Type: application/json

{
  "annotations": [
    {
      "id": "unique-id",
      "name": "UI Element Name",
      "rect": { "x": 10, "y": 10, "width": 100, "height": 50 },
      "relativeRect": { "x": 0.01, "y": 0.01, "width": 0.1, "height": 0.05 },
      "screenshotId": "screenshot-id"
    }
  ]
}

Response: { success: true, data: { message: "Annotations saved", versionCount: 2 } }
```

#### Update Annotations
```
PUT /api/annotations/:screenshotId
Content-Type: application/json

Same body as POST

Response: { success: true, data: { message: "Annotations updated" } }
```

#### Get Version History
```
GET /api/annotations/:screenshotId/versions

Response: { success: true, data: Version[] }
```

#### Rollback to Version
```
POST /api/annotations/:screenshotId/rollback/:versionId

Response: { success: true, data: AnnotationData }
```

### Python Generation Endpoints

#### Generate Python Code
```
POST /api/python/generate
Content-Type: application/json

Response: { success: true, data: { code: "python code..." } }
```

## Data Model

### Screenshot
```typescript
{
  id: string;           // Unique ID
  filename: string;      // File name in data/screenshots/
  name: string;          // Display name
  group: Group;         // 'login' | 'game_main' | 'gameplay' | 'other'
  uploadTime: string;   // ISO timestamp
}
```

### Annotation
```typescript
{
  id: string;
  name: string;
  rect: {
    x: number;        // Absolute X (pixels)
    y: number;        // Absolute Y (pixels)
    width: number;     // Absolute width (pixels)
    height: number;    // Absolute height (pixels)
  };
  relativeRect: {
    x: number;        // Relative X (0-1)
    y: number;        // Relative Y (0-1)
    width: number;     // Relative width (0-1)
    height: number;    // Relative height (0-1)
  };
  screenshotId: string;
}
```

### Version
```typescript
{
  timestamp: string;      // ISO timestamp
  annotations: Annotation[]; // Annotation snapshot
  description: string;   // Version description
}
```

### AnnotationData
```typescript
{
  screenshotId: string;
  currentAnnotations: Annotation[]; // Current annotations
  versions: Version[];              // Version history
}
```

## File Structure

```
airtest_template_picker/
├── data/
│   ├── screenshots/        # Uploaded screenshot files
│   └── annotations/       # Annotation JSON files
├── output/
│   └── templates.py      # Generated Python code
├── server/
│   ├── api/              # API routes
│   └── lib/              # Server utilities
├── src/
│   ├── components/        # React components
│   ├── lib/              # Utilities
│   └── types/            # TypeScript types
├── public/                 # Static files
├── rspack.config.ts        # Build configuration
├── tsconfig.json          # TypeScript configuration
├── server.ts              # Server entry point
└── package.json           # Project dependencies
```

## Tips

- **Image Format**: Supports PNG, JPG, and other common image formats
- **Coordinate System**: Both absolute (pixels) and relative (0-1) coordinates are stored
- **Version Control**: Every save creates a new version, enabling easy rollback
- **Python Output**: Generated code uses Airtest Template format with proper parameters
- **Grouping**: Use groups to organize screenshots by game area

## Troubleshooting

### Server Won't Start
- Check if port is already in use
- Verify dependencies are installed: `npm install`

### Annotations Not Saving
- Check browser console for errors
- Verify server is running
- Check file permissions on `data/annotations/`

### Python Code Not Generating
- Ensure at least one annotation exists
- Check server logs for errors

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## License

MIT

## Support

For issues and questions, please refer to the project documentation or contact the development team.
