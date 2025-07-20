import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    first_name: '',
    last_name: '',
    phone_number: ''
  });
  const [localError, setLocalError] = useState('');
  
  const { login, register, loading } = useAuth();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setLocalError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (isLogin) {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        onClose();
        setFormData({
          email: '',
          password: '',
          username: '',
          first_name: '',
          last_name: '',
          phone_number: ''
        });
      } else {
        setLocalError(result.error);
      }
    } else {
      // Registration validation
      if (!formData.email || !formData.password || !formData.username || 
          !formData.first_name || !formData.last_name) {
        setLocalError('Tous les champs obligatoires doivent être remplis');
        return;
      }

      if (formData.password.length < 6) {
        setLocalError('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }

      const result = await register(formData);
      if (result.success) {
        onClose();
        setFormData({
          email: '',
          password: '',
          username: '',
          first_name: '',
          last_name: '',
          phone_number: ''
        });
      } else {
        setLocalError(result.error);
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setLocalError('');
    setFormData({
      email: '',
      password: '',
      username: '',
      first_name: '',
      last_name: '',
      phone_number: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {isLogin ? 'Connexion' : 'Inscription'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            {isLogin 
              ? 'Connectez-vous à Reality+ et commencez à gagner !' 
              : 'Créez votre compte Reality+ gratuit'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {localError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{localError}</p>
            </div>
          )}

          {/* Registration Fields */}
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!isLogin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!isLogin}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom d'utilisateur *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!isLogin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone (optionnel)
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+33123456789"
                />
              </div>
            </>
          )}

          {/* Common Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
            {!isLogin && (
              <p className="text-xs text-gray-500 mt-1">
                Minimum 6 caractères
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {isLogin ? 'Connexion...' : 'Inscription...'}
              </div>
            ) : (
              isLogin ? 'Se connecter' : "S'inscrire"
            )}
          </button>

          {/* Toggle Mode */}
          <div className="text-center pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={toggleMode}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {isLogin 
                ? "Pas encore de compte ? S'inscrire" 
                : 'Déjà un compte ? Se connecter'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;