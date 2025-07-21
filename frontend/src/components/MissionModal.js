import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MissionModal = ({ mission, isOpen, onClose, onSubmissionSuccess }) => {
  const [step, setStep] = useState('details'); // details, submit, submitting, success
  const [photos, setPhotos] = useState([]);
  const [location, setLocation] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const getMissionIcon = (category) => {
    switch (category) {
      case 'photo': return '📸';
      case 'walk': return '🚶';
      case 'recycle': return '♻️';
      case 'help': return '🤝';
      default: return '⭐';
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (photos.length < mission.max_photos) {
            setPhotos(prev => [...prev, {
              id: Date.now() + Math.random(),
              base64: e.target.result,
              name: file.name
            }]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removePhoto = (photoId) => {
    setPhotos(photos.filter(p => p.id !== photoId));
  };

  const getLocation = () => {
    setGettingLocation(true);
    setError('');
    
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par ce navigateur');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setGettingLocation(false);
      },
      (error) => {
        setError('Erreur lors de l\'obtention de la localisation: ' + error.message);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleSubmit = async () => {
    setError('');
    
    // Validation
    if (mission.requires_photo && photos.length < mission.min_photos) {
      setError(`Cette mission nécessite au moins ${mission.min_photos} photo(s)`);
      return;
    }
    
    if (mission.requires_location && !location) {
      setError('Cette mission nécessite votre localisation');
      return;
    }

    setStep('submitting');

    try {
      const submissionData = {
        mission_id: mission.id,
        photos_base64: photos.map(p => p.base64),
        location_data: location,
        notes: notes.trim() || null
      };

      const response = await axios.post(
        `${API}/missions/${mission.id}/submit`,
        submissionData
      );

      setStep('success');
      setTimeout(() => {
        onSubmissionSuccess && onSubmissionSuccess(response.data);
        handleClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting mission:', error);
      setError(error.response?.data?.detail || 'Erreur lors de la soumission');
      setStep('submit');
    }
  };

  const handleClose = () => {
    setStep('details');
    setPhotos([]);
    setLocation(null);
    setNotes('');
    setError('');
    onClose();
  };

  if (!isOpen || !mission) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{getMissionIcon(mission.category)}</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{mission.title}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-lg font-bold text-blue-600">{formatMoney(mission.money_reward)}</span>
                  <span className="text-sm text-gray-500">+ {mission.xp_reward} XP</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'details' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-600">{mission.description}</p>
              </div>

              {/* Requirements */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Exigences</h3>
                <div className="space-y-2">
                  {mission.requires_photo && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      </svg>
                      <span>{mission.min_photos} à {mission.max_photos} photo(s) requise(s)</span>
                    </div>
                  )}
                  {mission.requires_location && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span>Localisation GPS requise</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-gray-600">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span>Récompense: {formatMoney(mission.money_reward)} + {mission.xp_reward} XP</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep('submit')}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
              >
                Commencer la Mission
              </button>
            </div>
          )}

          {step === 'submit' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Soumettre votre Mission</h3>
                
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {/* Photos Upload */}
                {mission.requires_photo && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Photos ({photos.length}/{mission.max_photos})
                    </label>
                    
                    {photos.length < mission.max_photos && (
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept="image/*"
                          multiple
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors"
                        >
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-600">
                            Cliquez pour ajouter des photos
                          </p>
                        </button>
                      </div>
                    )}

                    {photos.length > 0 && (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        {photos.map((photo) => (
                          <div key={photo.id} className="relative">
                            <img 
                              src={photo.base64} 
                              alt="Mission" 
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removePhoto(photo.id)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Location */}
                {mission.requires_location && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Localisation
                    </label>
                    {!location ? (
                      <button
                        onClick={getLocation}
                        disabled={gettingLocation}
                        className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors disabled:opacity-50"
                      >
                        <svg className="mx-auto h-8 w-8 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <p className="text-sm text-blue-700">
                          {gettingLocation ? 'Obtention de la localisation...' : 'Obtenir ma localisation'}
                        </p>
                      </button>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-green-700 text-sm">Localisation obtenue</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Ajoutez des détails sur votre mission..."
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setStep('details')}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                  >
                    Soumettre
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'submitting' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Soumission en cours...</h3>
              <p className="text-gray-600">Veuillez patienter pendant l'envoi de votre mission.</p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mission soumise avec succès !</h3>
              <p className="text-gray-600 mb-4">
                Votre soumission est en cours de révision. Vous recevrez vos récompenses une fois approuvée.
              </p>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-blue-700 font-medium">
                  Récompense à venir: {formatMoney(mission.money_reward)} + {mission.xp_reward} XP
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MissionModal;