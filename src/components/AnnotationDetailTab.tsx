import React from 'react';
import { PixiJSCore } from '../lib/PixiJSCore';
import type { Annotation } from '../types/index';

interface AnnotationDetailTabProps {
  selectedAnnotationId: string | null;
  editingLabel: string;
  selectedTargetPos: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  imageSize: { width: number; height: number };
  pixiCoreRef: React.MutableRefObject<PixiJSCore | null>;
  onLabelChange: (id: string, label: string) => void;
  onTargetPosChange: (pos: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) => void;
  onDelete: () => void;
}

export default function AnnotationDetailTab({
  selectedAnnotationId,
  editingLabel,
  selectedTargetPos,
  imageSize,
  pixiCoreRef,
  onLabelChange,
  onTargetPosChange,
  onDelete,
}: AnnotationDetailTabProps) {
  if (!selectedAnnotationId) {
    return (
      <div className="text-center py-8 text-gray-500">
        Please select an annotation to view details
      </div>
    );
  }

  return (
    <div className='py-4 px-2'>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={editingLabel}
          onChange={(e) => {
            onLabelChange(selectedAnnotationId, e.target.value);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Target Position (模板匹配目标位置)</label>
        <select
          value={selectedTargetPos}
          onChange={(e) => {
            const newValue = parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
            onTargetPosChange(newValue);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={1}>1 - 上方</option>
          <option value={2}>2 - 上中</option>
          <option value={3}>3 - 上右</option>
          <option value={4}>4 - 左侧</option>
          <option value={5}>5 - 中心</option>
          <option value={6}>6 - 右侧</option>
          <option value={7}>7 - 右下</option>
          <option value={8}>8 - 下方</option>
          <option value={9}>9 - 右下</option>
        </select>
      </div>

      {pixiCoreRef.current && pixiCoreRef.current.getAnnotation(selectedAnnotationId) && (
        <div className="mt-4 space-y-2">
          <div className="bg-gray-50 p-4 rounded-md">
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              Absolute (Pixels)
            </h5>
            <div className="text-sm space-y-1 text-gray-600">
              {(() => {
                const ann = pixiCoreRef.current?.getAnnotation(selectedAnnotationId);
                return ann ? (
                  <>
                    <div>X: {ann.rect.x.toFixed(2)}</div>
                    <div>Y: {ann.rect.y.toFixed(2)}</div>
                    <div>Width: {ann.rect.width.toFixed(2)}</div>
                    <div>Height: {ann.rect.height.toFixed(2)}</div>
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

      <div className="mt-6 flex gap-2">
        <button
          onClick={onDelete}
          className="px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Delete Selected
        </button>
      </div>
    </div>
  );
}
