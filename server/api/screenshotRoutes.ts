import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Screenshot, ApiResponse, UploadRequest } from '../../src/types/index';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';

const router = Router();

// Multer config for file uploads
const upload = multer({
  dest: 'data/screenshots/',
  storage: multer.diskStorage({
    destination: 'data/screenshots/',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
  }),
});

interface UploadRequestWithFile extends UploadRequest {
  file?: Express.Multer.File;
}

// Upload screenshot
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { name, group } = req.body as UploadRequestWithFile;
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const screenshot: Screenshot = {
      id: file.filename,
      filename: file.filename,
      name: name || file.originalname || 'unknown',
      group: (group || 'other') as 'login' | 'game_main' | 'gameplay' | 'other',
      uploadTime: new Date().toISOString(),
    };

    res.json({ success: true, data: screenshot });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get all screenshots
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const screenshots: Screenshot[] = [];

    const files = await fs.readdir('data/screenshots');

    for (const file of files) {
      const filePath = path.join('data/screenshots', file);

      try {
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          screenshots.push({
            id: file,
            filename: file,
            name: file,
            group: 'other',
            uploadTime: stats.mtime.toISOString(),
          });
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    // Filter by search term if provided
    let filteredScreenshots = screenshots;
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filteredScreenshots = screenshots.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.filename.toLowerCase().includes(searchLower)
      );
    } else {
      filteredScreenshots = screenshots;
    }

    res.json({ success: true, data: filteredScreenshots });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get single screenshot
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const filePath = path.join('data/screenshots', id);

    const stats = await fs.stat(filePath);

    if (!stats.isFile()) {
      return res.status(404).json({ success: false, error: 'Screenshot not found' });
    }

    const screenshot: Screenshot = {
      id,
      filename: id,
      name: id || 'unknown',
      group: 'other',
      uploadTime: stats.mtime.toISOString(),
    };

    res.json({ success: true, data: screenshot });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Delete screenshot
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const filePath = path.join('data/screenshots', id);

    await fs.unlink(filePath);

    // Also delete associated annotations
    const annotationPath = path.join('data/annotations', `${id}.json`);
    try {
      await fs.unlink(annotationPath);
    } catch (error) {
      // Annotation file doesn't exist, ignore
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
