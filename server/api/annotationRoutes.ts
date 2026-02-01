import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Annotation, AnnotationData, Version } from '../../src/types/index';
import {
  saveAnnotation,
  loadAnnotation,
  getAllAnnotations,
  deleteAnnotation,
  rollbackVersion,
} from '../lib/fileStorage';

const router = Router();

// Get annotations for a screenshot
router.get('/:screenshotId', async (req: Request, res: Response) => {
  try {
    const { screenshotId } = req.params as { screenshotId: string };
    const data = await loadAnnotation(screenshotId);

    if (!data) {
      return res.status(404).json({ success: false, error: 'Annotations not found' });
    }

    res.json({ success: true, data: data.currentAnnotations });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Save annotations (create new version)
router.post('/:screenshotId', async (req: Request, res: Response) => {
  try {
    const { screenshotId } = req.params as { screenshotId: string };
    const { annotations } = req.body as { annotations: Annotation[] };

    if (!Array.isArray(annotations)) {
      return res.status(400).json({ success: false, error: 'Invalid annotations format' });
    }

    await saveAnnotation(screenshotId, annotations);

    res.json({ success: true, data: { message: 'Annotations saved', versionCount: (await loadAnnotation(screenshotId))?.versions.length || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Update current annotations
router.put('/:screenshotId', async (req: Request, res: Response) => {
  try {
    const { screenshotId } = req.params as { screenshotId: string };
    const { annotations } = req.body as { annotations: Annotation[] };

    if (!Array.isArray(annotations)) {
      return res.status(400).json({ success: false, error: 'Invalid annotations format' });
    }

    await saveAnnotation(screenshotId, annotations);

    res.json({ success: true, data: { message: 'Annotations updated' } });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get version history
router.get('/:screenshotId/versions', async (req: Request, res: Response) => {
  try {
    const { screenshotId } = req.params as { screenshotId: string };
    const data = await loadAnnotation(screenshotId);

    if (!data) {
      return res.status(404).json({ success: false, error: 'Annotations not found' });
    }

    res.json({ success: true, data: data.versions });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Rollback to a specific version
router.post('/:screenshotId/rollback/:versionId', async (req: Request, res: Response) => {
  try {
    const { screenshotId, versionId } = req.params as { screenshotId: string; versionId: string };
    const versionIndex = parseInt(versionId, 10);

    const data = await rollbackVersion(screenshotId, versionIndex);

    res.json({ success: true, data: data });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
