import React, { useState } from 'react';
import { PixiJSCore } from '../lib/PixiJSCore';
import type { Annotation } from '../types/index';
import AnnotationDetailTab from './AnnotationDetailTab';
import AnnotationListTab from './AnnotationListTab';

interface AnnotationTabsProps {
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  editingLabel: string;
  selectedTargetPos: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  imageSize: { width: number; height: number };
  pixiCoreRef: React.MutableRefObject<PixiJSCore | null>;
  onLabelChange: (id: string, label: string) => void;
  onTargetPosChange: (pos: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) => void;
  onSelectAnnotation: (id: string, name: string) => void;
  onDelete: () => void;
}

export default function AnnotationTabs({
  annotations,
  selectedAnnotationId,
  editingLabel,
  selectedTargetPos,
  imageSize,
  pixiCoreRef,
  onLabelChange,
  onTargetPosChange,
  onSelectAnnotation,
  onDelete,
}: AnnotationTabsProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'list'>('details');

  const handleSelectFromList = (id: string, name: string) => {
    onSelectAnnotation(id, name);
    setActiveTab('details');
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Tab Navigation */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-2 py-1 font-medium transition-colors ${
            activeTab === 'details'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Selected ({selectedAnnotationId ? '1' : '0'})
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`px-2 py-1 font-medium transition-colors ${
            activeTab === 'list'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({annotations?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'details' && (
          <AnnotationDetailTab
            selectedAnnotationId={selectedAnnotationId}
            editingLabel={editingLabel}
            selectedTargetPos={selectedTargetPos}
            imageSize={imageSize}
            pixiCoreRef={pixiCoreRef}
            onLabelChange={onLabelChange}
            onTargetPosChange={onTargetPosChange}
            onDelete={onDelete}
          />
        )}

        {activeTab === 'list' && (
          <AnnotationListTab
            annotations={annotations || []}
            selectedAnnotationId={selectedAnnotationId}
            onSelectAnnotation={handleSelectFromList}
          />
        )}
      </div>
    </div>
  );
}
