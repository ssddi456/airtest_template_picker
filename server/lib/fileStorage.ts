import { promises as fs } from 'fs';
import path from 'path';
import type { Screenshot, Annotation, AnnotationData, Version } from '../../src/types/index';

const ANNOTATIONS_DIR = 'data/annotations';
const SCREENSHOTS_DIR = 'data/screenshots';

// Ensure directories exist
export async function ensureDirectories() {
  await fs.mkdir(ANNOTATIONS_DIR, { recursive: true });
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
}

// Get annotation file path
function getAnnotationPath(screenshotId: string): string {
  return path.join(ANNOTATIONS_DIR, `${screenshotId}.json`);
}

// Save annotation data with version history
export async function saveAnnotation(screenshotId: string, annotations: Annotation[]): Promise<void> {
  await ensureDirectories();

  const annotationPath = getAnnotationPath(screenshotId);

  // Read existing data
  let existingData: AnnotationData = {
    screenshotId,
    currentAnnotations: [],
    versions: [],
  };

  try {
    const content = await fs.readFile(annotationPath, 'utf-8');
    existingData = JSON.parse(content);
  } catch (error) {
    // File doesn't exist yet, use default
  }

  // Create new version from current annotations
  const newVersion: Version = {
    timestamp: new Date().toISOString(),
    annotations: existingData.currentAnnotations,
    description: `Version ${existingData.versions.length + 1}`,
  };

  // Update with new annotations and version history
  existingData.currentAnnotations = annotations;
  existingData.versions.push(newVersion);

  // Save to file
  await fs.writeFile(annotationPath, JSON.stringify(existingData, null, 2));
}

// Load annotation data
export async function loadAnnotation(screenshotId: string): Promise<AnnotationData | null> {
  await ensureDirectories();

  const annotationPath = getAnnotationPath(screenshotId);

  try {
    const content = await fs.readFile(annotationPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

// Get all annotation files
export async function getAllAnnotations(): Promise<AnnotationData[]> {
  await ensureDirectories();

  try {
    const files = await fs.readdir(ANNOTATIONS_DIR);
    const annotations: AnnotationData[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(ANNOTATIONS_DIR, file), 'utf-8');
        annotations.push(JSON.parse(content));
      }
    }

    return annotations;
  } catch (error) {
    return [];
  }
}

// Delete annotation data
export async function deleteAnnotation(screenshotId: string): Promise<void> {
  const annotationPath = getAnnotationPath(screenshotId);

  try {
    await fs.unlink(annotationPath);
  } catch (error) {
    // File doesn't exist, ignore
  }
}

// Rollback to a specific version
export async function rollbackVersion(screenshotId: string, versionIndex: number): Promise<AnnotationData> {
  const data = await loadAnnotation(screenshotId);

  if (!data || versionIndex < 0 || versionIndex >= data.versions.length) {
    throw new Error('Invalid version index');
  }

  // Get the target version annotations
  const targetVersion = data.versions[versionIndex];

  if (!targetVersion) {
    throw new Error('Version not found');
  }

  // Save current state as new version
  const newVersion: Version = {
    timestamp: new Date().toISOString(),
    annotations: data.currentAnnotations,
    description: `Rollback to version ${versionIndex + 1}`,
  };

  // Update current annotations and add new version
  data.currentAnnotations = targetVersion.annotations;
  data.versions.push(newVersion);

  // Save
  const annotationPath = getAnnotationPath(screenshotId);
  await fs.writeFile(annotationPath, JSON.stringify(data, null, 2));

  return data;
}

// Calculate relative coordinates from absolute coordinates
export function calculateRelativeRect(
  absoluteRect: { x: number; y: number; width: number; height: number },
  imageSize: { width: number; height: number }
): { x: number; y: number; width: number; height: number } {
  return {
    x: absoluteRect.x / imageSize.width,
    y: absoluteRect.y / imageSize.height,
    width: absoluteRect.width / imageSize.width,
    height: absoluteRect.height / imageSize.height,
  };
}
