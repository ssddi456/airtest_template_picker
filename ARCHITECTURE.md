# Airtest Template Manager Architecture

## Overview

Airtest Template Manager is a full-stack web application built with React (frontend) and Express (backend) that allows users to manage Airtest automation test screenshots, annotate UI elements with rectangle markers, maintain version history, and automatically generate Python Template code.

## Project Structure

```
airtest_template_picker/
├── data/                       # Data storage directory
│   ├── screenshots/            # Uploaded image files
│   └── annotations/           # Annotation JSON files (version history)
├── output/                      # Generated output files
│   └── templates.py          # Auto-generated Python code
├── server/                      # Backend server code
│   ├── api/                  # API route handlers
│   │   ├── screenshotRoutes.ts    # Screenshot CRUD operations
│   │   ├── annotationRoutes.ts   # Annotation version management
│   │   └── pythonRoutes.ts      # Python code generation
│   └── lib/                  # Server utilities
│       └── fileStorage.ts       # File I/O and version logic
├── src/                         # Frontend React application
│   ├── components/            # React components
│   │   ├── Layout.tsx          # App layout (header, footer)
│   │   ├── Navigation.tsx       # Tab navigation
│   │   ├── ScreenshotManager.tsx # Screenshot CRUD UI
│   │   ├── AnnotationEditor.tsx  # Canvas-based annotation editor
│   │   ├── VersionHistory.tsx   # Version management UI
│   │   └── PythonPreview.tsx    # Python code display
│   ├── lib/                  # Frontend utilities
│   │   └── api.ts             # API client functions
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts           # Shared type definitions
│   ├── App.tsx               # Main application component
│   └── index.tsx             # Application entry point
├── public/                      # Static assets
├── rspack.config.ts            # Rspack build configuration
├── server.ts                    # Express server entry point
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.js           # TailwindCSS configuration
├── postcss.config.js           # PostCSS configuration
└── package.json                 # Dependencies and scripts
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser (React)                      │
│  ┌──────────────┐  ┌──────────────┐              │
│  │  Screenshots  │  │  Annotations  │              │
│  │    Manager   │  │    Editor    │              │
│  └──────────────┘  └──────────────┘              │
│         │                   │                            │
│         │  Version      │  Python                   │
│         │  History      │  Preview                   │
│         ▼               ▼                            │
│      ┌────────────────────────────┐                  │
│      │      API Client           │                  │
│      │    (src/lib/api.ts)    │                  │
│      └────────────────────────────┘                  │
└───────────────────┬──────────────────────────────────────┘
                    │ HTTP/JSON
                    ▼
┌──────────────────────────────────────────────────────────────┐
│              Express Server (server.ts)                 │
│  ┌──────────────┐  ┌──────────────┐                │
│  │  Screenshot  │  │  Annotation  │                │
│  │   Routes    │  │    Routes    │                │
│  └──────────────┘  └──────────────┘                │
│         │                   │                           │
│  ┌──────┴──────────────┴────────┐                  │
│  │    File Storage Layer          │                  │
│  │ (server/lib/fileStorage.ts)   │                  │
│  └──────────────┬──────────────┘                  │
│                 │                                   │
│  ┌──────────────┴──────────────┐                 │
│  │     File System              │                 │
│  │  JSON + Image Files          │                 │
│  └──────────────────────────────┘                 │
└──────────────────────────────────────────────────────────────┘
```

## Data Model

### Screenshot
Represents an uploaded screenshot image.

```typescript
interface Screenshot {
  id: string;              // Unique identifier (filename)
  filename: string;        // File name in data/screenshots/
  name: string;            // Display name
  group: Group;            // Category: 'login' | 'game_main' | 'gameplay' | 'other'
  uploadTime: string;       // ISO timestamp of upload
}
```

### Annotation
Represents a UI element marked on a screenshot.

```typescript
interface Annotation {
  id: string;                    // Unique identifier
  name: string;                  // User-defined name (e.g., "Login Button")
  rect: Rect;                    // Absolute coordinates (pixels)
  relativeRect: Rect;            // Relative coordinates (0-1 range)
  screenshotId: string;          // Parent screenshot ID
}

interface Rect {
  x: number;        // Top-left X
  y: number;        // Top-left Y
  width: number;     // Width
  height: number;    // Height
}
```

### Version
Represents a snapshot of annotations at a point in time.

```typescript
interface Version {
  timestamp: string;        // ISO timestamp
  annotations: Annotation[];  // Complete annotation snapshot
  description: string;      // Version description
}
```

### AnnotationData
Complete annotation data including current state and history.

```typescript
interface AnnotationData {
  screenshotId: string;          // Screenshot identifier
  currentAnnotations: Annotation[]; // Current active annotations
  versions: Version[];            // Historical versions
}
```

## API Endpoints

### Screenshot Management
| Method | Endpoint | Description |
|---------|-----------|-------------|
| POST | `/api/screenshots` | Upload screenshot with metadata |
| GET | `/api/screenshots?search=<query>` | List all screenshots (optional search) |
| GET | `/api/screenshots/:id` | Get single screenshot |
| DELETE | `/api/screenshots/:id` | Delete screenshot and annotations |

### Annotation Management
| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/annotations/:screenshotId` | Get current annotations for screenshot |
| POST | `/api/annotations/:screenshotId` | Save annotations (creates new version) |
| PUT | `/api/annotations/:screenshotId` | Update current annotations |
| GET | `/api/annotations/:screenshotId/versions` | Get version history |
| POST | `/api/annotations/:screenshotId/rollback/:versionId` | Rollback to version |

### Python Generation
| Method | Endpoint | Description |
|---------|-----------|-------------|
| POST | `/api/python/generate` | Generate Python Template code |

## Frontend Components

### Layout (`src/components/Layout.tsx`)
- Provides header with application title
- Provides footer with copyright
- Wraps main content area

### Navigation (`src/components/Navigation.tsx`)
- Tab-based navigation
- Views: Screenshots, Annotations, History, Python Code
- Highlights active view

### ScreenshotManager (`src/components/ScreenshotManager.tsx`)
- Upload screenshots via drag-drop or file picker
- List all screenshots with metadata
- Delete screenshots
- Search and filter by group
- Select screenshot for annotation

### PixiJSAnnotationEditor (`src/components/PixiJSAnnotationEditor.tsx`)
- Canvas-based rectangle drawing
- Create, select, move, resize rectangles
- Display absolute and relative coordinates
- Name annotations
- Save to server

### VersionHistory (`src/components/VersionHistory.tsx`)
- Display all versions
- Show annotation snapshot per version
- Rollback to previous version
- Timestamp tracking

### PythonPreview (`src/components/PythonPreview.tsx`)
- Display generated Python code
- Generate code from annotations
- Copy to clipboard
- Usage instructions

## Backend Modules

### Server (`server.ts`)
- Express application setup
- Middleware configuration (CORS, JSON parsing, file upload)
- Static file serving
- API route mounting
- Auto port allocation

### Screenshot Routes (`server/api/screenshotRoutes.ts`)
- Handle file uploads with multer
- Read screenshot files from filesystem
- Delete screenshots and associated annotations

### Annotation Routes (`server/api/annotationRoutes.ts`)
- Save annotations with version tracking
- Load current annotations
- Retrieve version history
- Rollback to historical version

### Python Routes (`server/api/pythonRoutes.ts`)
- Generate Python Template code
- Group by screenshot groups
- Format for Airtest API

### File Storage (`server/lib/fileStorage.ts`)
- JSON file I/O operations
- Version history management
- Relative coordinate calculation
- Directory management

## Data Flow

### Upload Screenshot
```
1. User selects file in ScreenshotManager
2. File uploaded via POST /api/screenshots
3. Server saves file to data/screenshots/
4. Screenshot added to list
```

### Create Annotation
```
1. User draws rectangle on canvas in PixiJSAnnotationEditor
2. Coordinates captured (absolute + relative)
3. User enters annotation name
4. Click "Save Annotations"
5. POST /api/annotations/:screenshotId
6. Server creates new version
7. Saves to data/annotations/:screenshotId.json
```

### Rollback Version
```
1. User views VersionHistory
2. Selects version to rollback
3. POST /api/annotations/:screenshotId/rollback/:versionId
4. Server saves current state as new version
5. Restores target version as current
6. Updates data/annotations/:screenshotId.json
```

### Generate Python Code
```
1. User clicks "Generate Code" in PythonPreview
2. GET /api/python/generate
3. Server reads all annotation files
4. Generates Python Template dictionary
5. Returns formatted code
6. User copies to clipboard
```

## Key Design Decisions

### JSON File Storage
- **Decision**: Use JSON files instead of database
- **Reason**: Simple, portable, no external dependencies
- **Trade-off**: Not suitable for high-concurrency scenarios

### Version History
- **Decision**: Store versions in same file as current annotations
- **Decision**: "Current + Versions" array structure
- **Reason**: Simple file structure, easy to read/write
- **Trade-off**: File grows with many versions

### Relative Coordinates
- **Decision**: Store both absolute and relative coordinates
- **Reason**: Responsive design support
- **Formula**: `relative = absolute / imageSize`
- **Range**: 0-1 for all dimensions

### No User Authentication
- **Decision**: No authentication system
- **Reason**: Local tool, not web-facing
- **Trade-off**: No multi-user support

## Build Process

### Rspack Configuration
- Entry: `src/index.tsx`
- Output: `dist/`
- Loaders: TypeScript, CSS, File
- Plugins: React Fast Refresh, HTML generation
- Dev Server: Hot reload with auto port

### TailwindCSS Integration
- PostCSS processing
- Utility-first CSS
- Responsive utilities
- Custom configuration in `tailwind.config.js`

## Environment

### Development
```bash
npm start
# Starts Express + Rspack dev server
# Auto-reload on file changes
```

### Production
```bash
npm run build
# Builds static files to dist/
# Express serves dist/ in production mode
```

## Dependencies

### Frontend
- React: UI framework
- React DOM: Browser rendering
- TypeScript: Type safety
- TailwindCSS: Styling
- Rspack: Build tool

### Backend
- Express: Web server
- Multer: File upload handling
- Node.js fs: File I/O

## Extension Points

### Adding New Annotation Shapes
- Modify `src/components/PixiJSAnnotationEditor.tsx` canvas drawing logic
- Update `src/types/index.ts` Annotation interface
- Adjust `server/lib/fileStorage.ts` coordinate calculation

### Adding New Screenshot Groups
- Update `src/types/index.ts` Group type
- Add option to `src/components/ScreenshotManager.tsx` UI
- Update Python generation logic in `server/api/pythonRoutes.ts`

### Exporting to Other Formats
- Add new route in `server/api/`
- Implement format-specific generation logic
- Add UI button in `src/components/PythonPreview.tsx`
