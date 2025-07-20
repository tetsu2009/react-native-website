import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(dateString));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2 rounded-xl">
                <span className="text-xl font-bold">R+</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reality+</h1>
                <p className="text-sm text-gray-600">Tu bouges ? Tu aides ? Tu gagnes.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Bienvenue,</p>
                <p className="font-semibold text-gray-900">{user?.first_name}</p>
              </div>
              <button
                onClick={logout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Salut {user?.first_name} ! 👋
              </h2>
              <p className="text-blue-100 text-lg mb-4">
                Prêt à gagner de l'argent avec Reality+ ?
              </p>
              <div className="flex items-center space-x-6">
                <div>
                  <p className="text-blue-100 text-sm">Niveau</p>
                  <p className="text-2xl font-bold">{user?.level}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">XP</p>
                  <p className="text-2xl font-bold">{user?.xp}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Série</p>
                  <p className="text-2xl font-bold">{user?.streak_days} jours</p>
                </div>
              </div>
            </div>
            <div className="mt-6 md:mt-0">
              <div className="bg-white bg-opacity-20 backdrop-blur rounded-xl p-4">
                <p className="text-blue-100 text-sm mb-1">Solde actuel</p>
                <p className="text-3xl font-bold">{formatMoney(user?.current_balance || 0)}</p>
                <p className="text-blue-100 text-sm mt-2">
                  Total gagné: {formatMoney(user?.total_money_earned || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Missions complétées</p>
                <p className="text-2xl font-bold text-gray-900">{user?.missions_completed}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Missions en cours</p>
                <p className="text-2xl font-bold text-gray-900">{user?.missions_in_progress}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Dernière activité</p>
                <p className="text-sm font-medium text-gray-900">
                  {user?.last_activity ? formatDate(user.last_activity) : 'Aucune'}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Missions Available */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Missions Disponibles</h3>
            <div className="text-center py-12">
              <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">Missions en développement</p>
              <p className="text-sm text-gray-500">
                Bientôt disponible ! Des missions photos, marche, recyclage et aide.
              </p>
            </div>
          </div>

          {/* Profile Settings */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du Profil</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Email</span>
                <span className="text-gray-900 font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Nom d'utilisateur</span>
                <span className="text-gray-900 font-medium">{user?.username}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Téléphone</span>
                <span className="text-gray-900 font-medium">
                  {user?.phone_number || 'Non renseigné'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Membre depuis</span>
                <span className="text-gray-900 font-medium">
                  {user?.created_at ? formatDate(user.created_at) : 'Récemment'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;