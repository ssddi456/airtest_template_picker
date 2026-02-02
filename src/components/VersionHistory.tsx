import React, { useState, useEffect } from 'react';
import type { Version } from '../types/index';
import { getVersionHistory, rollbackVersion } from '../lib/api';

interface VersionHistoryProps {
  screenshotId: string;
  onRollback?: () => void;
}

export default function VersionHistory({
  screenshotId,
  onRollback,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rollingBack, setRollingBack] = useState(false);

  // Load version history
  const loadVersions = async () => {
    setLoading(true);
    setError(null);
    const result = await getVersionHistory(screenshotId);
    setLoading(false);

    if (result.success && result.data) {
      setVersions(result.data);
    } else if (result.error) {
      setError(result.error);
    }
  };

  useEffect(() => {
    loadVersions();
  }, [screenshotId]);

  // Handle rollback
  const handleRollback = async (versionIndex: number) => {
    if (
      !confirm(
        `Are you sure you want to rollback to version ${versionIndex + 1}?`
      )
    ) {
      return;
    }

    setRollingBack(true);
    setError(null);

    const result = await rollbackVersion(
      screenshotId,
      versionIndex.toString()
    );
    setRollingBack(false);

    if (result.success) {
      alert('Rollback successful!');
      loadVersions();
      if (onRollback) {
        onRollback();
      }
    } else {
      setError(result.error || 'Failed to rollback');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">Version History</h2>
        <p className="text-gray-600">
          View and manage annotation version history
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Version List */}
      <div className="bg-white rounded-lg shadow p-6">
        {loading && (
          <div className="text-center py-8 text-gray-600">Loading...</div>
        )}

        {!loading && versions.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            No version history available. Create some annotations first.
          </div>
        )}

        {!loading && versions.length > 0 && (
          <div className="space-y-4">
            {versions.map((version, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {version.description}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(version.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRollback(index)}
                    disabled={rollingBack}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {rollingBack ? 'Rolling back...' : 'Rollback'}
                  </button>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Annotations ({version.annotations.length})
                  </h4>

                  <div className="space-y-2">
                    {version.annotations.map((ann) => (
                      <div
                        key={ann.id}
                        className="bg-gray-50 p-3 rounded-md"
                      >
                        <div className="font-medium">{ann.name}</div>
                        <div className="text-sm text-gray-600">
                          Position: ({ann.rect.x}, {ann.rect.y},{' '}
                          {ann.rect.width}, {ann.rect.height})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
