import React, { useState } from 'react';
import Layout from './components/Layout';
import Navigation from './components/Navigation';

type View = 'screenshots' | 'annotations' | 'history' | 'python';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('screenshots');

  return (
    <Layout>
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      {currentView === 'screenshots' && (
        <div className="text-center py-8">
          <p className="text-gray-600">Screenshot manager component coming soon...</p>
        </div>
      )}
      {currentView === 'annotations' && (
        <div className="text-center py-8">
          <p className="text-gray-600">Annotation editor component coming soon...</p>
        </div>
      )}
      {currentView === 'history' && (
        <div className="text-center py-8">
          <p className="text-gray-600">Version history component coming soon...</p>
        </div>
      )}
      {currentView === 'python' && (
        <div className="text-center py-8">
          <p className="text-gray-600">Python preview component coming soon...</p>
        </div>
      )}
    </Layout>
  );
}
