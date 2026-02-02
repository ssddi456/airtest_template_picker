import React, { useState, useEffect, useRef } from 'react';
import type { Annotation, Rect } from '../types/index';
import { getAnnotations, saveAnnotations } from '../lib/api';

interface AnnotationEditorProps {
  screenshotId: string;
  screenshotName: string;
  screenshotPath: string;
}

interface ExtendedAnnotation extends Annotation {
  id: string;
  name: string;
  rect: Rect;
  relativeRect: Rect;
  screenshotId: string;
}

export default function AnnotationEditor({
  screenshotId,
  screenshotName,
  screenshotPath,
}: AnnotationEditorProps) {
  const [annotations, setAnnotations] = useState<ExtendedAnnotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<Rect | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Load annotations
  const loadAnnotations = async () => {
    setLoading(true);
    setError(null);
    const result = await getAnnotations(screenshotId);
    setLoading(false);

    if (result.success && result.data) {
      setAnnotations(result.data);
    } else if (result.error) {
      setError(result.error);
    }
  };

  useEffect(() => {
    loadAnnotations();
  }, [screenshotId]);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
      setImageLoaded(true);
      drawCanvas();
    };
    img.src = screenshotPath;
    imageRef.current = img;
  }, [screenshotPath]);

  // Draw canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw annotations
    annotations.forEach((ann) => {
      const isSelected = ann.id === selectedAnnotation;
      const rect = ann.rect;

      ctx.strokeStyle = isSelected ? '#3b82f6' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

      ctx.fillStyle = isSelected ? '#3b82f6' : '#ef4444';
      ctx.fillRect(rect.x - 2, rect.y - 2, 4, 4);
      ctx.fillRect(rect.x + rect.width - 2, rect.y - 2, 4, 4);
      ctx.fillRect(rect.x - 2, rect.y + rect.height - 2, 4, 4);
      ctx.fillRect(
        rect.x + rect.width - 2,
        rect.y + rect.height - 2,
        4,
        4
      );

      ctx.fillStyle = '#000000';
      ctx.font = '12px sans-serif';
      ctx.fillText(ann.name, rect.x, rect.y - 6);
    });

    // Draw current rectangle (while drawing)
    if (currentRect) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        currentRect.x,
        currentRect.y,
        currentRect.width,
        currentRect.height
      );
    }
  };

  useEffect(() => {
    drawCanvas();
  }, [annotations, selectedAnnotation, currentRect, imageLoaded]);

  // Handle canvas events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageLoaded || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if clicking on existing annotation
    const clickedAnnotation = annotations.find(
      (ann) =>
        x >= ann.rect.x &&
        x <= ann.rect.x + ann.rect.width &&
        y >= ann.rect.y &&
        y <= ann.rect.y + ann.rect.height
    );

    if (clickedAnnotation) {
      setSelectedAnnotation(clickedAnnotation.id);
      setEditingName(clickedAnnotation.name);
    } else {
      setSelectedAnnotation(null);
      setIsDrawing(true);
      setDrawStart({ x, y });
      setCurrentRect({ x, y, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStart || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const width = x - drawStart.x;
    const height = y - drawStart.y;

    setCurrentRect({
      x: width < 0 ? x : drawStart.x,
      y: height < 0 ? y : drawStart.y,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentRect) return;

    setIsDrawing(false);

    // Don't create tiny rectangles
    if (currentRect.width < 10 || currentRect.height < 10) {
      setCurrentRect(null);
      setDrawStart(null);
      return;
    }

    // Calculate relative coordinates
    const relativeRect = {
      x: currentRect.x / imageSize.width,
      y: currentRect.y / imageSize.height,
      width: currentRect.width / imageSize.width,
      height: currentRect.height / imageSize.height,
    };

    // Create new annotation
    const newAnnotation: ExtendedAnnotation = {
      id: Date.now().toString(),
      name: `Annotation ${annotations.length + 1}`,
      rect: currentRect,
      relativeRect,
      screenshotId,
    };

    setAnnotations([...annotations, newAnnotation]);
    setSelectedAnnotation(newAnnotation.id);
    setEditingName(newAnnotation.name);
    setCurrentRect(null);
    setDrawStart(null);
  };

  // Handle delete
  const handleDelete = () => {
    if (!selectedAnnotation) return;

    setAnnotations(annotations.filter((ann) => ann.id !== selectedAnnotation));
    setSelectedAnnotation(null);
    setEditingName('');
  };

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const result = await saveAnnotations(
      screenshotId,
      annotations.map((ann) => ({
        id: ann.id,
        name: ann.name,
        rect: ann.rect,
        relativeRect: ann.relativeRect,
        screenshotId: ann.screenshotId,
      }))
    );

    setSaving(false);

    if (result.success) {
      alert('Annotations saved successfully!');
    } else {
      setError(result.error || 'Failed to save annotations');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">Annotation Editor</h2>
        <p className="text-gray-600">
          {screenshotName} - Draw rectangles to annotate UI elements
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Canvas */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {imageLoaded && (
              <span>
                Image: {imageSize.width} x {imageSize.height} pixels
              </span>
            )}
          </div>
          <div className="space-x-2">
            {selectedAnnotation && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Selected
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !imageLoaded}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Annotations'}
            </button>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="border border-gray-300 rounded cursor-crosshair w-full"
          style={{ maxWidth: '100%', height: 'auto' }}
        />

        <p className="mt-2 text-sm text-gray-600">
          Click and drag to draw rectangles. Click on a rectangle to select it.
        </p>
      </div>

      {/* Selected Annotation Details */}
      {selectedAnnotation && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Selected Annotation</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={editingName}
                onChange={(e) => {
                  setEditingName(e.target.value);
                  setAnnotations(
                    annotations.map((ann) =>
                      ann.id === selectedAnnotation
                        ? { ...ann, name: e.target.value }
                        : ann
                    )
                  );
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID
              </label>
              <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-600">
                {selectedAnnotation}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Coordinates</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Absolute (Pixels)
                </h5>
                {annotations
                  .find((ann) => ann.id === selectedAnnotation)
                  ?.rect && (
                  <div className="text-sm space-y-1 text-gray-600">
                    <div>X: {annotations.find((a) => a.id === selectedAnnotation)?.rect.x}</div>
                    <div>
                      Y: {annotations.find((a) => a.id === selectedAnnotation)?.rect.y}
                    </div>
                    <div>
                      Width:{' '}
                      {annotations.find((a) => a.id === selectedAnnotation)?.rect.width}
                    </div>
                    <div>
                      Height:{' '}
                      {annotations.find((a) => a.id === selectedAnnotation)?.rect.height}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Relative (0-1)
                </h5>
                {annotations
                  .find((ann) => ann.id === selectedAnnotation)
                  ?.relativeRect && (
                  <div className="text-sm space-y-1 text-gray-600">
                    <div>
                      X:{' '}
                      {annotations.find((a) => a.id === selectedAnnotation)
                        ?.relativeRect.x.toFixed(3)}
                    </div>
                    <div>
                      Y:{' '}
                      {annotations.find((a) => a.id === selectedAnnotation)
                        ?.relativeRect.y.toFixed(3)}
                    </div>
                    <div>
                      Width:{' '}
                      {annotations.find((a) => a.id === selectedAnnotation)
                        ?.relativeRect.width.toFixed(3)}
                    </div>
                    <div>
                      Height:{' '}
                      {annotations.find((a) => a.id === selectedAnnotation)
                        ?.relativeRect.height.toFixed(3)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Annotations List */}
      {annotations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            All Annotations ({annotations.length})
          </h3>

          <div className="space-y-2">
            {annotations.map((ann) => (
              <div
                key={ann.id}
                onClick={() => setSelectedAnnotation(ann.id)}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedAnnotation === ann.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{ann.name}</div>
                <div className="text-sm text-gray-600">
                  ({ann.rect.x}, {ann.rect.y}, {ann.rect.width}, {ann.rect.height})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
