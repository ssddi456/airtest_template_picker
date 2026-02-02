import React, { useState } from 'react';
import type { Screenshot } from './types/index';
import Layout from './components/Layout';
import Navigation from './components/Navigation';
import ScreenshotManager from './components/ScreenshotManager';
import AnnotationEditor from './components/AnnotationEditor';
import VersionHistory from './components/VersionHistory';
import PythonPreview from './components/PythonPreview';

type View = 'screenshots' | 'annotations' | 'history' | 'python';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('screenshots');
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);

  return (
    <Layout>
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      {currentView === 'screenshots' && (
        <ScreenshotManager onScreenshotSelect={(screenshot) => {
          setSelectedScreenshot(screenshot);
          setCurrentView('annotations');
        }} />
      )}
      {currentView === 'annotations' && selectedScreenshot ? (
        <AnnotationEditor
          screenshotId={selectedScreenshot.id}
          screenshotName={selectedScreenshot.name}
          screenshotPath={`/data/screenshots/${selectedScreenshot.filename}`}
        />
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">Please select a screenshot to annotate.</p>
          <button
            onClick={() => setCurrentView('screenshots')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Screenshots
          </button>
        </div>
      )}
      {currentView === 'history' && selectedScreenshot ? (
        <VersionHistory
          screenshotId={selectedScreenshot.id}
          onRollback={() => {
            loadAnnotations(selectedScreenshot.id);
          }}
        />
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">Please select a screenshot to view history.</p>
          <button
            onClick={() => setCurrentView('screenshots')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Screenshots
          </button>
        </div>
      )}
      {currentView === 'python' && <PythonPreview />}
    </Layout>
  );

  async function loadAnnotations(screenshotId: string) {
    // This function can be used to reload annotations after rollback
    const response = await fetch(`/api/annotations/${screenshotId}`);
    if (response.ok) {
      // Annotations reloaded
    }
  }
}
