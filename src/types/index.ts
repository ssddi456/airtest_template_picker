// Screenshot type
export interface Screenshot {
  id: string;
  filename: string;
  name: string;
  group: Group;
  uploadTime: string;
}

// Group type - preset groups for screenshots
export type Group = 'login' | 'game_main' | 'gameplay' | 'other';

// Rectangle type for UI element position
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Annotation type for UI element labeling
export interface Annotation {
  id: string;
  name: string;
  rect: Rect; // Absolute coordinates (pixels)
  targetPos: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; // Target position for template matching
  screenshotId: string;
}

// Version type for version history
export interface Version {
  timestamp: string;
  annotations: Annotation[];
  description: string;
}

// AnnotationData type for storing current and historical annotations
export interface AnnotationData {
  screenshotId: string;
  currentAnnotations: Annotation[];
  sourceSize: Rect;
  versions: Version[];
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Upload request type
export interface UploadRequest {
  name: string;
  group: Group;
}

// Screenshot list response
export interface ScreenshotListResponse {
  screenshots: Screenshot[];
}
