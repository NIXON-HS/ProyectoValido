import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const App = () => (
  <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">TECHSTORE 360</h1>
      <p className="text-gray-600 mb-6">Panel Administrativo React</p>
      <div className="space-y-3">
        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-300">
          Iniciar Sesión en Firebase
        </button>
        <p className="text-sm text-gray-500 mt-4">Diseñado usando Tailwind CSS</p>
      </div>
    </div>
  </div>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
