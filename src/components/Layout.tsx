import React from 'react';
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Airtest Template Manager
          </h1>
          <Navigation />
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto">
        {children}
      </main>

      <footer className="bg-gray-100 border-t">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-gray-600">
          <p>© 2026 Airtest Template Manager. Built with React, TailwindCSS, and Rspack.</p>
        </div>
      </footer>
    </div>
  );
}
