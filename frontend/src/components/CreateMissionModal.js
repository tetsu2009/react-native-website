import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateMissionModal = ({ isOpen, onClose, onMissionCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'photo',
    difficulty: 'easy',
    xp_reward: 10,
    money_reward: 1.0,
    requires_photo: true,
    requires_location: false,
    min_photos: 1,
    max_photos: 3,
    is_daily: false,
    available_until: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
               type === 'number' ? parseFloat(value) || 0 : value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Le titre et la description sont obligatoires');
      setLoading(false);
      return;
    }

    if (formData.xp_reward < 1 || formData.money_reward < 0.1) {
      setError('Les récompenses doivent être positives (min 1 XP, 0.1€)');
      setLoading(false);
      return;
    }

    try {
      const submitData = { ...formData };
      
      // Handle date conversion
      if (submitData.available_until) {
        submitData.available_until = new Date(submitData.available_until).toISOString();
      } else {
        delete submitData.available_until;
      }

      const response = await axios.post(`${API}/missions`, submitData);
      
      onMissionCreated && onMissionCreated(response.data);
      handleClose();
    } catch (error) {
      console.error('Error creating mission:', error);
      setError(error.response?.data?.detail || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      category: 'photo',
      difficulty: 'easy',
      xp_reward: 10,
      money_reward: 1.0,
      requires_photo: true,
      requires_location: false,
      min_photos: 1,
      max_photos: 3,
      is_daily: false,
      available_until: ''
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Créer une Nouvelle Mission</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre de la mission *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Prendre une photo du coucher de soleil"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Décrivez en détail ce que l'utilisateur doit faire..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="photo">📸 Photo</option>
                  <option value="walk">🚶 Marche</option>
                  <option value="recycle">♻️ Recyclage</option>
                  <option value="help">🤝 Aide</option>
                  <option value="other">⭐ Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulté
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="easy">🟢 Facile</option>
                  <option value="medium">🟡 Moyen</option>
                  <option value="hard">🔴 Difficile</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rewards */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Récompenses</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  XP à gagner *
                </label>
                <input
                  type="number"
                  name="xp_reward"
                  value={formData.xp_reward}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Argent à gagner (€) *
                </label>
                <input
                  type="number"
                  name="money_reward"
                  value={formData.money_reward}
                  onChange={handleInputChange}
                  min="0.1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Exigences</h3>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="requires_photo"
                  checked={formData.requires_photo}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Nécessite des photos</span>
              </label>

              {formData.requires_photo && (
                <div className="ml-6 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Photos min</label>
                    <input
                      type="number"
                      name="min_photos"
                      value={formData.min_photos}
                      onChange={handleInputChange}
                      min="1"
                      max={formData.max_photos}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Photos max</label>
                    <input
                      type="number"
                      name="max_photos"
                      value={formData.max_photos}
                      onChange={handleInputChange}
                      min={formData.min_photos}
                      max="10"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="requires_location"
                  checked={formData.requires_location}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Nécessite la localisation GPS</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_daily"
                  checked={formData.is_daily}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Mission quotidienne (peut être refaite chaque jour)</span>
              </label>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Disponible jusqu'à (optionnel)
            </label>
            <input
              type="datetime-local"
              name="available_until"
              value={formData.available_until}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-6">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer la Mission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMissionModal;