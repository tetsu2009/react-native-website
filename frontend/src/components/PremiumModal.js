import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PremiumModal = ({ isOpen, onClose, onUpgradeSuccess }) => {
  const [tiers, setTiers] = useState([]);
  const [selectedTier, setSelectedTier] = useState('bronze');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchTiers();
    }
  }, [isOpen]);

  const fetchTiers = async () => {
    try {
      const response = await axios.get(`${API}/premium/tiers`);
      setTiers(response.data.tiers);
    } catch (error) {
      console.error('Error fetching tiers:', error);
      setError('Erreur lors du chargement des offres');
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/premium/upgrade`, {
        tier: selectedTier,
        duration_months: 1
      });

      onUpgradeSuccess && onUpgradeSuccess(response.data);
      onClose();
    } catch (error) {
      console.error('Error upgrading:', error);
      setError(error.response?.data?.detail || 'Erreur lors de la mise à niveau');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'bronze': return 'from-orange-400 to-orange-600';
      case 'silver': return 'from-gray-400 to-gray-600';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'free': return '🆓';
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      default: return '⭐';
    }
  };

  if (!isOpen) return null;

  const premiumTiers = tiers.filter(t => t.name !== 'free');
  const currentTier = tiers.find(t => t.name === user?.premium_tier);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold mb-2">Reality+ Premium</h2>
              <p className="text-purple-100">Maximisez vos gains avec nos offres Premium !</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 text-2xl font-bold bg-white bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Current Status */}
          {currentTier && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getTierIcon(user.premium_tier)}</div>
                  <div>
                    <h3 className="font-bold text-blue-900">
                      Statut actuel: {currentTier.display_name}
                    </h3>
                    <p className="text-blue-700 text-sm">
                      Multiplicateur de gains: x{currentTier.multiplier}
                    </p>
                  </div>
                </div>
                {user?.premium_expires && (
                  <div className="text-right">
                    <p className="text-blue-700 text-sm">Expire le:</p>
                    <p className="font-semibold text-blue-900">
                      {new Date(user.premium_expires).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Tiers Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {premiumTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                  selectedTier === tier.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${tier.name === 'gold' ? 'ring-2 ring-yellow-400' : ''}`}
                onClick={() => setSelectedTier(tier.name)}
              >
                {tier.name === 'gold' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                      POPULAIRE
                    </span>
                  </div>
                )}

                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${getTierColor(tier.name)} text-white text-2xl font-bold mb-4`}>
                  {getTierIcon(tier.name)}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.display_name}</h3>
                
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">{tier.price_monthly}€</span>
                  <span className="text-gray-600">/mois</span>
                </div>

                <div className="bg-green-100 rounded-lg p-3 mb-4">
                  <p className="text-green-800 font-bold text-center">
                    +{Math.round((tier.multiplier - 1) * 100)}% de gains !
                  </p>
                  <p className="text-green-700 text-sm text-center">
                    x{tier.multiplier} multiplicateur
                  </p>
                </div>

                <ul className="space-y-2">
                  {tier.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>

                {selectedTier === tier.name && (
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none">
                    <div className="absolute top-2 right-2">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Benefits Comparison */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">💰 Exemple de gains</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tiers.map((tier) => (
                <div key={tier.name} className="text-center">
                  <div className="text-lg">{getTierIcon(tier.name)}</div>
                  <p className="font-semibold text-gray-900">{tier.display_name}</p>
                  <p className="text-sm text-gray-600">Mission 5€</p>
                  <p className="font-bold text-green-600">
                    {(5 * tier.multiplier).toFixed(2)}€
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Plus tard
            </button>
            <button
              onClick={handleUpgrade}
              disabled={loading || !selectedTier}
              className={`flex-2 bg-gradient-to-r ${getTierColor(selectedTier)} text-white py-3 px-8 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Activation...
                </div>
              ) : (
                `Activer ${tiers.find(t => t.name === selectedTier)?.display_name} - ${tiers.find(t => t.name === selectedTier)?.price_monthly}€/mois`
              )}
            </button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-500 text-center mt-4">
            * Version démo - Aucun paiement réel ne sera effectué
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;