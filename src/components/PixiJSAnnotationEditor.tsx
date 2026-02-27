import React, { useRef, useEffect, useState, useCallback } from 'react';
import { getAnnotations, saveAnnotations } from '../lib/api';
import { PixiJSCore, AnnotationData as PixiAnnotationData, PixiJSCoreCallbacks } from '../lib/PixiJSCore';
import type { AnnotationData as ApiAnnotationData, Annotation } from '../types/index';
import { isSameAnnotationData } from '../lib/data';
import AnnotationTabs from './AnnotationTabs';

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
  const [initiated, setInitiated] = useState(false);
  const [annotationData, setAnnotationData] = useState<ApiAnnotationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string>('');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [selectedTargetPos, setSelectedTargetPos] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>(5);

  // 加载标注数据
  const loadAnnotations = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getAnnotations(screenshotId);
    setLoading(false);

    if (result.success && result.data) {
      if (!isSameAnnotationData(annotationData, result.data)) {
        setAnnotationData(result.data);
      }
      pixiCoreRef.current?.setAnnotations(result.data.currentAnnotations);
    } else if (result.error) {
      setError(result.error);
    }
  }, [screenshotId, annotationData]);

  // 将 PixiAnnotationData 转换为 Annotation，保留 targetPos
  const convertToAnnotation = useCallback((pixiAnn: PixiAnnotationData, existingAnnotations: Annotation[]): Annotation => {
    const existing = existingAnnotations.find(e => e.id === pixiAnn.id);
    return {
      id: pixiAnn.id,
      name: pixiAnn.name,
      rect: pixiAnn.rect,
      targetPos: existing?.targetPos || 5,
      screenshotId,
    };
  }, [screenshotId]);

  // 初始化 PixiJS 应用
  useEffect(() => {
    if (!canvasRef.current || !screenshotPath) return;

    const callbacks: PixiJSCoreCallbacks = {
      onAnnotationSelected: (id: string, label: string) => {
        setSelectedAnnotationId(id);
        setEditingLabel(label);
        // 从 annotationData 中获取 targetPos
        const ann = annotationData?.currentAnnotations.find(a => a.id === id);
        if (ann) {
          setSelectedTargetPos(ann.targetPos);
        }
      },
      onAnnotationCreated: async (annotation: PixiAnnotationData) => {
        setLoading(true);
        console.log('Annotation created:', annotation);

        // 创建新标注时添加 targetPos 字段（默认值为 1）
        const existingAnnotations = annotationData?.currentAnnotations || [];
        const newAnnotation = convertToAnnotation(annotation, existingAnnotations);

        const pixiAnnotations = pixiCoreRef.current?.getAllAnnotations() || [];
        const allAnnotations: Annotation[] = [
          ...pixiAnnotations.map(ann => convertToAnnotation(ann, existingAnnotations)),
          newAnnotation
        ];

        await saveAnnotations(
          screenshotId,
          { x: 0, y: 0, width: imageSize.width, height: imageSize.height },
          allAnnotations);
        await loadAnnotations();
        setLoading(false);
      },
      onAnnotationUpdated: async (id: string, rect: PixiAnnotationData['rect']) => {
        setLoading(true);

        console.log('Annotation updated:', id, rect);
        const pixiAnnotations = pixiCoreRef.current?.getAllAnnotations() || [];

        // 保留 targetPos
        const existingAnnotations = annotationData?.currentAnnotations || [];
        const annotations: Annotation[] = pixiAnnotations.map((ann) => convertToAnnotation(ann, existingAnnotations));

        await saveAnnotations(screenshotId, {
          x: 0, y: 0, width: imageSize.width, height: imageSize.height
        }, annotations);
        await loadAnnotations();
        setLoading(false);
      },
      onImageLoaded: (width: number, height: number) => {
        setImageSize({ width, height });
      },
    };
    const initApp = () => {

      if (!pixiCoreRef.current) {
        const pixiCore = new PixiJSCore(callbacks);
        pixiCoreRef.current = pixiCore;
        pixiCoreRef.current.initialize(canvasRef.current!, screenshotPath);
        if (annotationData) {
          pixiCoreRef.current.setAnnotations(annotationData.currentAnnotations);
        }
      } else {
        pixiCoreRef.current.updateCallbacks(callbacks);
      }

    };

    if (!initiated) {
      setInitiated(true);
      loadAnnotations();
      initApp();
    } else {
      pixiCoreRef.current!.updateCallbacks(callbacks);
    }

    return () => {
    };
  }, [
    canvasRef.current,
    initiated,
    screenshotPath,
    annotationData,
    loadAnnotations,
    convertToAnnotation
  ]);


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
      console.log('Global mouse up:', e.clientX, e.clientY);
      if (!pixiCoreRef.current) {
        console.log('No pixiCoreRef on mouse up');
        return;
      }

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) {
        console.log('No canvas rect on mouse up');
        return;
      }

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const event = { global: { x, y } } as unknown as any;
      pixiCoreRef.current.handleMouseUp(event);
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
    handleSave();
  };

  // 保存标注
  const handleSave = async () => {
    if (!pixiCoreRef.current) return;

    setSaving(true);
    setError(null);

    try {
      const pixiAnnotations = pixiCoreRef.current.getAllAnnotations();

      // 获取现有的 annotations 数据以保留 targetPos
      const existingAnnotations = annotationData?.currentAnnotations || [];

      const annotations: Annotation[] = pixiAnnotations.map((ann) => {
        // 如果是当前选中的标注，使用 selectedTargetPos，否则使用现有值
        if (ann.id === selectedAnnotationId) {
          return {
            id: ann.id,
            name: ann.name,
            rect: ann.rect,
            targetPos: selectedTargetPos,
            screenshotId,
          };
        }

        const existing = existingAnnotations.find(e => e.id === ann.id);
        return {
          id: ann.id,
          name: ann.name,
          rect: ann.rect,
          targetPos: existing?.targetPos || 5, // 默认值为 5
          screenshotId,
        };
      });

      const result = await saveAnnotations(
        screenshotId,
        { x: 0, y: 0, width: imageSize.width, height: imageSize.height },
        annotations);

      setSaving(false);

      if (result.success) {
        await loadAnnotations();
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
      <div className="bg-white  my-6">
        <p className="text-gray-600">
          {imageSize.width > 0 ? (
            <div className="flex justify-between  items-center">
              <div>
                {screenshotName} {imageSize.width} x {imageSize.height} px
              </div>
              <div className="flex items-center">
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      // Reset view to default (handled by pixi-viewport)
                      if (pixiCoreRef.current) {
                        pixiCoreRef.current.resetView();
                      }
                    }}
                    className="px-2 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Reset View
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <span className="text-yellow-600">
              Loading image... (Path: {screenshotPath})
            </span>
          )}
        </p>
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

      {/* PixiJS Canvas Container & Annotation Tabs */}
      <div className="flex gap-6 my-6">
        {/* Left: Canvas */}
        <div className="flex-1 bg-white rounded-lg shadow flex flex-col">
          <div
            ref={canvasRef}
            className={`
              border border-gray-300 rounded bg-gray-100 cursor-crosshair
              h-150
            `}
            style={{ width: '100%', overflow: 'hidden' }}
          />
        </div>

        {/* Right: Annotation Tabs */}
        <div className="w-64">
          <AnnotationTabs
            annotations={annotationData?.currentAnnotations || []}
            selectedAnnotationId={selectedAnnotationId}
            editingLabel={editingLabel}
            selectedTargetPos={selectedTargetPos}
            imageSize={imageSize}
            pixiCoreRef={pixiCoreRef}
            onLabelChange={updateAnnotationLabel}
            onTargetPosChange={setSelectedTargetPos}
            onSelectAnnotation={selectAnnotation}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
