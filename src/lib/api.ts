import type { Rect, Screenshot, ApiResponse, UploadRequest, Annotation } from '../types/index';

// API base URL - empty means same origin
const API_BASE = '';

// Generic fetch wrapper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Screenshot API
export async function uploadScreenshot(
  file: File,
  name: string,
  group: UploadRequest['group']
): Promise<ApiResponse<Screenshot>> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  formData.append('group', group);

  try {
    const response = await fetch(`${API_BASE}/api/screenshots`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getScreenshots(
  search?: string
): Promise<ApiResponse<Screenshot[]>> {
  const params = new URLSearchParams();
  if (search) {
    params.append('search', search);
  }

  const endpoint = `/api/screenshots${params.toString() ? `?${params.toString()}` : ''}`;
  return apiRequest<Screenshot[]>(endpoint);
}

export async function getScreenshot(id: string): Promise<ApiResponse<Screenshot>> {
  return apiRequest<Screenshot>(`/api/screenshots/${id}`);
}

export async function deleteScreenshot(id: string): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/api/screenshots/${id}`, {
    method: 'DELETE',
  });
}

// Annotation API
export async function getAnnotations(
  screenshotId: string
): Promise<ApiResponse<import('../types/index').AnnotationData>> {
  return apiRequest<import('../types/index').AnnotationData>(`/api/annotations/${screenshotId}`);
}

export async function getAllAnnotations(): Promise<ApiResponse<any[]>> {
  // Get all screenshots first
  const screenshotsResult = await getScreenshots();
  if (!screenshotsResult.success || !screenshotsResult.data) {
    return { success: false, error: screenshotsResult.error || 'Failed to get screenshots' };
  }

  // Get annotations for each screenshot
  const allAnnotations: any[] = [];
  for (const screenshot of screenshotsResult.data) {
    const annResult = await getAnnotations(screenshot.id);
    if (annResult.success && annResult.data) {
      allAnnotations.push({
        screenshotId: screenshot.id,
        currentAnnotations: annResult.data,
      });
    }
  }

  return { success: true, data: allAnnotations };
}

export async function saveAnnotations(
  screenshotId: string,
  sourceSize: Rect,
  annotations: Annotation[]
): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/api/annotations/${screenshotId}`, {
    method: 'POST',
    body: JSON.stringify({ sourceSize, annotations }),
  });
}

export async function updateAnnotations(
  screenshotId: string,
  sourceSize: Rect,
  annotations: Annotation[]
): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/api/annotations/${screenshotId}`, {
    method: 'PUT',
    body: JSON.stringify({ sourceSize, annotations }),
  });
}

export async function getVersionHistory(
  screenshotId: string
): Promise<ApiResponse<any[]>> {
  return apiRequest<any[]>(`/api/annotations/${screenshotId}/versions`);
}

export async function rollbackVersion(
  screenshotId: string,
  versionId: string
): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/api/annotations/${screenshotId}/rollback/${versionId}`, {
    method: 'POST',
  });
}

// Python API
export async function generatePython(): Promise<ApiResponse<{ code: string }>> {
  return apiRequest<{ code: string }>('/api/python/generate', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function getPythonCode(): Promise<ApiResponse<{ code: string | null; message?: string }>> {
  return apiRequest<{ code: string | null; message?: string }>('/api/python', {
    method: 'GET',
  });
}
