import React from 'react';
import type { Annotation } from '../types/index';

interface AnnotationListTabProps {
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string, name: string) => void;
}

export default function AnnotationListTab({
  annotations,
  selectedAnnotationId,
  onSelectAnnotation,
}: AnnotationListTabProps) {
  if (!annotations || annotations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No annotations yet
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2 p-2">
        {annotations.map((ann) => (
          <div
            key={ann.id}
            onClick={() => onSelectAnnotation(ann.id, ann.name)}
            className={`p-3 border rounded cursor-pointer transition-colors ${
              selectedAnnotationId === ann.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium">{ann.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
