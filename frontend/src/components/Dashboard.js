import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MissionsList from './MissionsList';
import MissionModal from './MissionModal';
import CreateMissionModal from './CreateMissionModal';
import PremiumModal from './PremiumModal';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [selectedMission, setSelectedMission] = useState(null);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [activeTab, setActiveTab] = useState('missions');

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

  const handleSelectMission = (mission) => {
    setSelectedMission(mission);
    setShowMissionModal(true);
  };

  const handleSubmissionSuccess = () => {
    // Refresh user data or show success message
    console.log('Mission submitted successfully!');
    // TODO: Refresh missions list if needed
  };

  const handleMissionCreated = (newMission) => {
    console.log('New mission created:', newMission);
    // TODO: Refresh missions list
  };

  const handleUpgradeSuccess = (upgradeData) => {
    console.log('Premium upgrade successful:', upgradeData);
    // TODO: Refresh user data to show new premium status
  };

  const getPremiumBadge = () => {
    if (user?.premium_tier === 'free') return null;
    
    const badges = {
      bronze: { icon: '🥉', class: 'bg-orange-500 text-white' },
      silver: { icon: '🥈', class: 'bg-gray-500 text-white' },
      gold: { icon: '🥇', class: 'bg-yellow-500 text-white' }
    };

    const badge = badges[user?.premium_tier];
    if (!badge) return null;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${badge.class}`}>
        {badge.icon} {user.premium_tier.toUpperCase()}
      </span>
    );
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
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-900">Reality+</h1>
                  {getPremiumBadge()}
                </div>
                <p className="text-sm text-gray-600">Tu bouges ? Tu aides ? Tu gagnes.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user?.premium_tier === 'free' && (
                <button
                  onClick={() => setShowPremiumModal(true)}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 shadow-lg"
                >
                  ⭐ Premium
                </button>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-200"
              >
                + Créer Mission
              </button>
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
                {user?.premium_tier !== 'free' && (
                  <div>
                    <p className="text-blue-100 text-sm">Multiplicateur</p>
                    <p className="text-2xl font-bold text-yellow-300">x{user?.premium_multiplier}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 md:mt-0">
              <div className="bg-white bg-opacity-20 backdrop-blur rounded-xl p-4">
                <p className="text-blue-100 text-sm mb-1">Solde actuel</p>
                <p className="text-3xl font-bold">{formatMoney(user?.current_balance || 0)}</p>
                <p className="text-blue-100 text-sm mt-2">
                  Total gagné: {formatMoney(user?.total_money_earned || 0)}
                </p>
                {user?.premium_tier !== 'free' && (
                  <div className="mt-2 bg-yellow-400 bg-opacity-20 rounded px-2 py-1">
                    <p className="text-yellow-100 text-xs font-semibold">
                      Gains Premium actifs !
                    </p>
                  </div>
                )}
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

        {/* Premium CTA for Free Users */}
        {user?.premium_tier === 'free' && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">🚀 Multipliez vos gains avec Premium !</h3>
                <p className="text-yellow-100">
                  Gagnez jusqu'à 3x plus d'argent sur chaque mission avec nos offres Premium.
                </p>
              </div>
              <button
                onClick={() => setShowPremiumModal(true)}
                className="mt-4 md:mt-0 bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-orange-50 transition-colors"
              >
                Voir les offres ⭐
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('missions')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'missions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                🎯 Missions Disponibles
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                👤 Mon Profil
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'missions' && (
              <MissionsList onSelectMission={handleSelectMission} />
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Premium Status */}
                {user?.premium_tier !== 'free' && (
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {user.premium_tier === 'bronze' && '🥉'}
                          {user.premium_tier === 'silver' && '🥈'}
                          {user.premium_tier === 'gold' && '🥇'}
                        </div>
                        <div>
                          <h3 className="font-bold text-purple-900">
                            Membre {user.premium_tier.charAt(0).toUpperCase() + user.premium_tier.slice(1)} Premium
                          </h3>
                          <p className="text-purple-700 text-sm">
                            Multiplicateur actuel: x{user.premium_multiplier}
                          </p>
                        </div>
                      </div>
                      {user?.premium_expires && (
                        <div className="text-right">
                          <p className="text-purple-700 text-sm">Expire le:</p>
                          <p className="font-semibold text-purple-900">
                            {new Date(user.premium_expires).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <MissionModal
        mission={selectedMission}
        isOpen={showMissionModal}
        onClose={() => {
          setShowMissionModal(false);
          setSelectedMission(null);
        }}
        onSubmissionSuccess={handleSubmissionSuccess}
      />

      <CreateMissionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onMissionCreated={handleMissionCreated}
      />

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgradeSuccess={handleUpgradeSuccess}
      />
    </div>
  );
};

export default Dashboard;