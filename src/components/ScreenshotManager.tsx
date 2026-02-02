import React, { useState, useEffect } from 'react';
import type { Screenshot, Group } from '../types/index';
import {
  uploadScreenshot,
  getScreenshots,
  deleteScreenshot,
} from '../lib/api';

interface ScreenshotManagerProps {
  onScreenshotSelect?: (screenshot: Screenshot) => void;
}

export default function ScreenshotManager({
  onScreenshotSelect,
}: ScreenshotManagerProps) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<Group | 'all'>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadGroup, setUploadGroup] = useState<Group>('other');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load screenshots
  const loadScreenshots = async () => {
    setLoading(true);
    setError(null);
    const result = await getScreenshots(search);
    setLoading(false);

    if (result.success && result.data) {
      setScreenshots(result.data);
    } else {
      setError(result.error || 'Failed to load screenshots');
    }
  };

  useEffect(() => {
    loadScreenshots();
  }, [search]);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!uploadName.trim()) {
      setError('Please enter a name for the screenshot');
      return;
    }

    setUploading(true);
    setError(null);

    const result = await uploadScreenshot(file, uploadName, uploadGroup);
    setUploading(false);

    if (result.success) {
      setUploadName('');
      setUploadGroup('other');
      loadScreenshots();
    } else {
      setError(result.error || 'Failed to upload screenshot');
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file && file.type.startsWith('image/')) {
        setUploadName(file.name.replace(/\.[^/.]+$/, ''));
        handleFileUpload(file);
      } else {
        setError('Please upload an image file');
      }
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this screenshot?')) {
      return;
    }

    const result = await deleteScreenshot(id);
    if (result.success) {
      loadScreenshots();
    } else {
      setError(result.error || 'Failed to delete screenshot');
    }
  };

  // Filter screenshots
  const filteredScreenshots = screenshots.filter((s) => {
    if (groupFilter === 'all') return true;
    return s.group === groupFilter;
  });

  const groups: (Group | 'all')[] = ['all', 'login', 'game_main', 'gameplay', 'other'];

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Upload Screenshot</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              placeholder="Screenshot name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group
            </label>
            <select
              value={uploadGroup}
              onChange={(e) => setUploadGroup(e.target.value as Group)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="login">Login</option>
              <option value="game_main">Game Main</option>
              <option value="gameplay">Gameplay</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setUploadName(file.name.replace(/\.[^/.]+$/, ''));
                handleFileUpload(file);
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Uploading...' : 'Choose File or Drop Here'}
          </button>
          <p className="mt-2 text-sm text-gray-600">
            Supports PNG, JPG, and other image formats
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Group
            </label>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value as Group | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g === 'all' ? 'All Groups' : g.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Screenshot List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Screenshots ({filteredScreenshots.length})
        </h2>

        {loading && (
          <div className="text-center py-8 text-gray-600">Loading...</div>
        )}

        {!loading && filteredScreenshots.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            No screenshots found. Upload your first screenshot above.
          </div>
        )}

        {!loading && filteredScreenshots.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredScreenshots.map((screenshot) => (
              <div
                key={screenshot.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video bg-gray-100 relative">
                  <img
                    src={`/data/screenshots/${screenshot.filename}`}
                    alt={screenshot.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                  <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">
                    {screenshot.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-gray-100 text-xs font-medium rounded">
                      {screenshot.group.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(screenshot.uploadTime).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {onScreenshotSelect && (
                      <button
                        onClick={() => onScreenshotSelect(screenshot)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        Annotate
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(screenshot.id)}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                    >
                      Delete
                    </button>
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
