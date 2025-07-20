import React, { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthModal from "./components/AuthModal";
import Dashboard from "./components/Dashboard";

// Landing Page Component
const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Redirect to dashboard if already logged in
  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2 rounded-xl">
                <span className="text-xl font-bold">R+</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Reality+</h1>
                <p className="text-xs text-gray-600 hidden sm:block">Tu bouges ? Tu aides ? Tu gagnes.</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Se connecter
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Main Heading */}
          <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            Gagne de l'argent
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent block">
              avec Reality+
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Une application innovante qui te paie pour accomplir des missions concrètes dans la vraie vie : 
            prendre des photos, marcher, recycler, aider quelqu'un…
          </p>

          {/* Benefits */}
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 mb-12">
            <div className="flex items-center text-green-600">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">Gagne de l'argent simplement</span>
            </div>
            <div className="flex items-center text-blue-600">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="font-semibold">Refais les missions chaque jour</span>
            </div>
            <div className="flex items-center text-purple-600">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-semibold">100% halal, sécurisé et sans hasard</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-16">
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Commencer maintenant
            </button>
            <button className="bg-white text-gray-800 px-8 py-4 rounded-xl font-bold text-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl">
              En savoir plus
            </button>
          </div>

          {/* Mission Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                icon: "📸",
                title: "Prendre des Photos",
                description: "Capture des moments spéciaux et gagne de l'argent"
              },
              {
                icon: "🚶",
                title: "Marcher",
                description: "Reste actif et transforme tes pas en revenus"
              },
              {
                icon: "♻️",
                title: "Recycler",
                description: "Protège l'environnement et sois récompensé"
              },
              {
                icon: "🤝",
                title: "Aider",
                description: "Aide les autres et enrichis-toi moralement et financièrement"
              }
            ].map((mission, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100">
                <div className="text-4xl mb-4">{mission.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{mission.title}</h3>
                <p className="text-gray-600 text-sm">{mission.description}</p>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl p-8 text-center">
            <h3 className="text-3xl font-bold mb-4">Tu bouges ? Tu aides ? Tu gagnes.</h3>
            <p className="text-xl text-blue-100 mb-6">C'est Reality+.</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-200 shadow-lg"
            >
              Rejoindre Reality+
            </button>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;
