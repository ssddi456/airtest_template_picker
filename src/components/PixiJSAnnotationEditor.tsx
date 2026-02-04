import React, { useRef, useEffect, useState, useCallback } from 'react';
import { getAnnotations, saveAnnotations } from '../lib/api';
import { PixiJSCore, AnnotationData, PixiJSCoreCallbacks } from '../lib/PixiJSCore';

interface PixiJSAnnotationEditorProps {
  screenshotId: string;
  screenshotName: string;
  screenshotPath: string;
}

export default function PixiJSAnnotationEditor({
  screenshotId,
  screenshotName,
  screenshotPath,
}: PixiJSAnnotationEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const pixiCoreRef = useRef<PixiJSCore | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string>('');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // 初始化 PixiJS 应用
  useEffect(() => {
    if (!canvasRef.current) return;

    const initApp = () => {
      const callbacks: PixiJSCoreCallbacks = {
        onAnnotationSelected: (id: string, label: string) => {
          setSelectedAnnotationId(id);
          setEditingLabel(label);
        },
        onAnnotationCreated: (annotation: AnnotationData) => {
          console.log('Annotation created:', annotation);
        },
        onAnnotationUpdated: (id: string, rect: AnnotationData['rect']) => {
          console.log('Annotation updated:', id, rect);
        },
        onImageLoaded: (width: number, height: number) => {
          setImageSize({ width, height });
        },
      };

      const pixiCore = new PixiJSCore(callbacks);
      pixiCoreRef.current = pixiCore;

      if (canvasRef.current) {
        pixiCore.initialize(canvasRef.current, screenshotPath);
      }
    };

    initApp();

    return () => {
      if (pixiCoreRef.current) {
        pixiCoreRef.current.destroy();
        pixiCoreRef.current = null;
      }
    };
  }, [canvasRef.current, screenshotPath]);

  // 加载标注数据
  useEffect(() => {
    const loadAnnotations = async () => {
      setLoading(true);
      setError(null);

      const result = await getAnnotations(screenshotId);
      setLoading(false);

      if (result.success && result.data) {
        pixiCoreRef.current?.renderAnnotations(result.data);
      } else if (result.error) {
        setError(result.error);
      }
    };

    if (pixiCoreRef.current) {
      loadAnnotations();
    }
  }, [screenshotId]);

  // 全局鼠标事件
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!pixiCoreRef.current) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 创建模拟的 PIXI 事件
      const event = { global: { x, y } } as unknown as any;
      pixiCoreRef.current.handleMouseMove(event);
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (!pixiCoreRef.current) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const event = { global: { x, y } } as unknown as any;
      pixiCoreRef.current.handleMouseUp(event);
      pixiCoreRef.current.handleAnnotationPointerUp();
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  // 更新标注标签
  const updateAnnotationLabel = (id: string, newLabel: string) => {
    pixiCoreRef.current?.updateAnnotationLabel(id, newLabel);
    setEditingLabel(newLabel);
  };

  // 选择标注
  const selectAnnotation = useCallback((id: string, label: string) => {
    pixiCoreRef.current?.selectAnnotation(id, label);
  }, []);

  // 删除标注
  const handleDelete = () => {
    if (!selectedAnnotationId) return;

    pixiCoreRef.current?.deleteAnnotation(selectedAnnotationId);
    setSelectedAnnotationId(null);
    setEditingLabel('');
  };

  // 保存标注
  const handleSave = async () => {
    if (!pixiCoreRef.current) return;

    setSaving(true);
    setError(null);

    try {
      const annotations = pixiCoreRef.current.getAllAnnotations().map((ann) => ({
        id: ann.id,
        name: ann.name,
        rect: ann.rect,
        relativeRect: {
          x: ann.rect.x / imageSize.width,
          y: ann.rect.y / imageSize.height,
          width: ann.rect.width / imageSize.width,
          height: ann.rect.height / imageSize.height,
        },
        screenshotId,
      }));

      const result = await saveAnnotations(screenshotId, annotations);

      setSaving(false);

      if (result.success) {
        alert('Annotations saved successfully!');
      } else {
        setError(result.error || 'Failed to save annotations');
      }
    } catch (err) {
      setSaving(false);
      setError('Failed to save annotations: ' + (err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">
          PixiJS Annotation Editor (gl2D Format)
        </h2>
        <p className="text-gray-600">{screenshotName} - Draw rectangles to annotate UI elements</p>
        <div className="text-sm text-gray-500 mt-2">
          Controls: Scroll to zoom • Drag selected boxes to move • Drag corners to resize
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* PixiJS Canvas Container */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {imageSize.width > 0 && (
              <span>
                Image: {imageSize.width} x {imageSize.height} pixels | Scale: Auto (Use mouse wheel)
              </span>
            )}
          </div>
          <div className="space-x-2">
            {selectedAnnotationId && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Selected
              </button>
            )}
            <button
              onClick={() => {
                // Reset view to default (handled by pixi-viewport)
                if (pixiCoreRef.current) {
                  pixiCoreRef.current.resetView();
                }
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Reset View
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Annotations'}
            </button>
          </div>
        </div>

        <div
          ref={canvasRef}
          className="border border-gray-300 rounded bg-gray-100 cursor-crosshair"
          style={{ width: '100%', height: '600px', overflow: 'hidden' }}
        />

        <p className="mt-2 text-sm text-gray-600">
          Click and drag to draw rectangles. Click on a rectangle to select it.
          Selected boxes can be moved (drag) or resized (corner handles). Use mouse wheel to zoom.
        </p>
      </div>

      {/* Selected Annotation Details */}
      {selectedAnnotationId && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Selected Annotation</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={editingLabel}
              onChange={(e) => {
                updateAnnotationLabel(selectedAnnotationId, e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {pixiCoreRef.current && pixiCoreRef.current.getAnnotation(selectedAnnotationId) && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Absolute (Pixels)
                </h5>
                <div className="text-sm space-y-1 text-gray-600">
                  {(() => {
                    const ann = pixiCoreRef.current?.getAnnotation(selectedAnnotationId);
                    return ann ? (
                      <>
                        <div>X: {ann.rect.x}</div>
                        <div>Y: {ann.rect.y}</div>
                        <div>Width: {ann.rect.width}</div>
                        <div>Height: {ann.rect.height}</div>
                      </>
                    ) : null;
                  })()}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Relative (0-1)
                </h5>
                <div className="text-sm space-y-1 text-gray-600">
                  {(() => {
                    const ann = pixiCoreRef.current?.getAnnotation(selectedAnnotationId);
                    return ann ? (
                      <>
                        <div>X: {(ann.rect.x / imageSize.width).toFixed(3)}</div>
                        <div>Y: {(ann.rect.y / imageSize.height).toFixed(3)}</div>
                        <div>Width: {(ann.rect.width / imageSize.width).toFixed(3)}</div>
                        <div>Height: {(ann.rect.height / imageSize.height).toFixed(3)}</div>
                      </>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Annotations List */}
      {pixiCoreRef.current && pixiCoreRef.current.getAllAnnotations().length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            All Annotations ({pixiCoreRef.current.getAllAnnotations().length})
          </h3>

          <div className="space-y-2">
            {pixiCoreRef.current.getAllAnnotations().map((ann) => (
              <div
                key={ann.id}
                onClick={() => selectAnnotation(ann.id, ann.name)}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedAnnotationId === ann.id
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
