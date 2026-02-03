import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PixiJSAnnotationEditor from './PixiJSAnnotationEditor';
import type { Screenshot } from '../types/index';

export default function PixiJSAnnotationDetail() {
  const { id: screenshotId } = useParams<{ id: string }>();

  const [screenshotData, setScreenshotData] = useState<Screenshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScreenshotData = async () => {
      if (!screenshotId) return;

      try {
        const response = await fetch(`/api/screenshots/${screenshotId}`);
        const data = await response.json();

        if (data.success && data.data) {
          setScreenshotData(data.data);
          setLoading(false);
        } else {
          setError('加载截图信息失败');
          setLoading(false);
        }
      } catch (err) {
        setError('加载截图信息失败: ' + (err as Error).message);
        setLoading(false);
      }
    };

    fetchScreenshotData();
  }, [screenshotId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8 text-gray-600">加载中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8 text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!screenshotData) {
    return null;
  }

  return (
    <PixiJSAnnotationEditor
      screenshotId={screenshotId ?? ''}
      screenshotName={screenshotData.name}
      screenshotPath={`/data/screenshots/${screenshotData.filename}`}
    />
  );
}
