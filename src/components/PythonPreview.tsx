import React, { useState, useEffect } from 'react';
import { generatePython, getAllAnnotations } from '../lib/api';
import type { Annotation } from '../types/index';

export default function PythonPreview() {
  const [pythonCode, setPythonCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load Python code
  const loadPythonCode = async () => {
    setGenerating(true);
    setError(null);

    const result = await generatePython();
    setGenerating(false);

    if (result.success && result.data) {
      setPythonCode(result.data.code || '');
    } else if (result.error) {
      setError(result.error);
    }
  };

  useEffect(() => {
    loadPythonCode();
  }, []);

  // Handle copy
  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate Python code from annotations
  const generateFromAnnotations = async () => {
    setLoading(true);
    setError(null);

    const annotationsResult = await getAllAnnotations();

    if (annotationsResult.success && annotationsResult.data) {
      const allAnnotations = annotationsResult.data;

      const groups = ['login', 'game_main', 'gameplay', 'other'];

      let code = `# Auto-generated Airtest Template code
# Generated on: ${new Date().toISOString()}
from airtest.core.api import *

Templates = {
`;

      groups.forEach((group) => {
        const groupAnnotations = allAnnotations.filter(
          (item) => item.screenshotId.includes(group) || group === 'other'
        );

        if (groupAnnotations.length > 0) {
          code += `    # ${group.toUpperCase()}\n`;

          groupAnnotations.forEach((data) => {
            data.currentAnnotations.forEach((ann: Annotation) => {
              code += `    '${ann.name}': Template(r'../data/screenshots/${data.screenshotId}', record_pos=(${ann.rect.x}, ${ann.rect.y}, ${ann.rect.width}, ${ann.rect.height}), target_pos=(${ann.relativeRect.x * 800}, ${ann.relativeRect.y * 600}, ${ann.relativeRect.width * 800}, ${ann.relativeRect.height * 600}), resolution=(800, 600)),\n`;
            });
          });
        }
      });

      code += `}\n`;

      setPythonCode(code);
    } else if (annotationsResult.error) {
      setError(annotationsResult.error);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">Python Code Preview</h2>
        <p className="text-gray-600">
          Auto-generated Airtest Template code for all annotations
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={generateFromAnnotations}
          disabled={generating || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {generating || loading ? 'Generating...' : 'Generate Code'}
        </button>

        <button
          onClick={handleCopy}
          disabled={!pythonCode}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Python Code */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Generated Code</h3>

        {pythonCode ? (
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{pythonCode}</code>
          </pre>
        ) : (
          <div className="text-center py-8 text-gray-600">
            No code generated yet. Click "Generate Code" to create Python code.
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-blue-900">
          How to Use
        </h3>

        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>
            Generate the Python code using the "Generate Code" button above
          </li>
          <li>
            Copy the code to your clipboard using "Copy to Clipboard"
          </li>
          <li>
            Paste the code into your Airtest test script file (usually{' '}
            <code>output/templates.py</code> or similar)
          </li>
          <li>
            Use the <code>Templates</code> dictionary in your test scripts
          </li>
          <li>
            Example:{' '}
            <pre className="mt-2 bg-white p-2 rounded text-sm overflow-x-auto">
              <code>touch(Templates['Login Button'])</code>
            </pre>
          </li>
        </ol>
      </div>
    </div>
  );
}
