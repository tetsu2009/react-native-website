import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MissionsList = ({ onSelectMission }) => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/missions`);
      setMissions(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching missions:', error);
      setError('Erreur lors du chargement des missions');
    } finally {
      setLoading(false);
    }
  };

  const getMissionIcon = (category) => {
    switch (category) {
      case 'photo': return '📸';
      case 'walk': return '🚶';
      case 'recycle': return '♻️';
      case 'help': return '🤝';
      default: return '⭐';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Chargement des missions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={fetchMissions}
          className="mt-2 text-red-600 hover:text-red-800 font-medium"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune mission disponible</h3>
        <p className="text-gray-600">De nouvelles missions seront bientôt ajoutées !</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Missions Disponibles</h2>
        <span className="text-sm text-gray-600">{missions.length} missions</span>
      </div>

      <div className="grid gap-4">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-lg cursor-pointer"
            onClick={() => onSelectMission(mission)}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{getMissionIcon(mission.category)}</div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{mission.title}</h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${getDifficultyColor(mission.difficulty)}`}>
                      {mission.difficulty === 'easy' ? 'Facile' : mission.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg font-bold text-blue-600">{formatMoney(mission.money_reward)}</span>
                    <span className="text-sm text-gray-500">+ {mission.xp_reward} XP</span>
                  </div>
                  {mission.is_daily && (
                    <span className="inline-block bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full font-medium">
                      Quotidien
                    </span>
                  )}
                </div>
              </div>

              <p className="text-gray-600 mb-4 line-clamp-2">{mission.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {mission.requires_photo && (
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{mission.min_photos} photo{mission.min_photos > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {mission.requires_location && (
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Localisation requise</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{mission.completion_count} complétions</span>
                  </div>
                </div>

                <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200">
                  Commencer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MissionsList;