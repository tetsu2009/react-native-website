# 📘 Documentation Développeur - Reality+ App

## 🚀 Vue d'ensemble

Reality+ est une application full-stack qui permet aux utilisateurs de gagner de l'argent réel en accomplissant des missions dans la vraie vie. L'application dispose d'un système de premium pour multiplier les gains.

## 🏗️ Architecture Technique

### Stack Technologique
- **Frontend**: React 19 + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Base de données**: MongoDB
- **Authentification**: JWT
- **Services**: Supervisord pour la gestion des processus

### Structure des Dossiers
```
/app/
├── backend/              # API FastAPI
│   ├── server.py        # Serveur principal avec tous les endpoints
│   ├── requirements.txt # Dépendances Python
│   └── .env            # Variables d'environnement backend
├── frontend/            # Application React
│   ├── src/
│   │   ├── components/  # Composants React réutilisables
│   │   ├── contexts/   # Context API pour l'état global
│   │   ├── App.js      # Composant principal
│   │   └── index.js    # Point d'entrée React
│   ├── package.json    # Dépendances Node.js
│   └── .env           # Variables d'environnement frontend
└── test_result.md      # Documentation des tests
```

## 🎯 Fonctionnalités Principales

### 1. Système d'Authentification
- **Inscription/Connexion** avec JWT
- **Profils utilisateur** complets
- **Protection des routes** automatique

### 2. Système de Missions
- **CRUD missions** (Créer, Lire, Modifier, Supprimer)
- **Types de missions**: Photo, Marche, Recyclage, Aide
- **Soumission avec photos** (Base64)
- **Géolocalisation GPS**
- **Système de validation** admin

### 3. Système Premium
- **4 niveaux**: Free (x1), Bronze (x1.5), Silver (x2), Gold (x3)
- **Multiplicateur de gains** automatique
- **Gestion des abonnements** avec expiration

### 4. Système de Récompenses
- **XP et argent** pour chaque mission
- **Calcul automatique** des niveaux
- **Historique des transactions**

## 🔧 Comment Modifier l'Application

### Modifier le Backend (server.py)

#### Ajouter un nouveau endpoint
```python
@api_router.get("/nouveau-endpoint")
async def nouveau_endpoint():
    return {"message": "Nouveau endpoint"}
```

#### Modifier les modèles de données
Cherchez la section `# DATA MODELS` dans server.py :
```python
class NouveauModele(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    description: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

#### Ajouter de nouveaux types de missions
Dans le modèle `Mission`, modifiez la ligne :
```python
category: Literal["photo", "walk", "recycle", "help", "other", "nouveau_type"]
```

#### Modifier les prix Premium
Dans la fonction `get_premium_tiers()` :
```python
"price_monthly": 4.99,  # Changez ce prix
```

#### Modifier les multiplicateurs Premium
Dans `get_premium_multiplier()` :
```python
multipliers = {
    "free": 1.0,
    "bronze": 1.5,    # Changez ces valeurs
    "silver": 2.0,
    "gold": 3.0
}
```

### Modifier le Frontend

#### Ajouter un nouveau composant
1. Créez un fichier dans `/app/frontend/src/components/`
2. Importez et utilisez dans `Dashboard.js` :
```javascript
import NouveauComposant from './NouveauComposant';

// Dans le JSX
<NouveauComposant />
```

#### Modifier les couleurs et le design
Tailwind CSS est utilisé. Exemples de classes communes :
- `bg-blue-500` : Arrière-plan bleu
- `text-white` : Texte blanc
- `rounded-lg` : Coins arrondis
- `p-4` : Padding
- `m-4` : Margin

#### Ajouter de nouveaux appels API
Dans les composants, ajoutez :
```javascript
const response = await axios.get(`${API}/votre-endpoint`);
```

#### Modifier les icônes de missions
Dans `MissionsList.js`, fonction `getMissionIcon()` :
```javascript
case 'nouveau_type': return '🆕';
```

### Modifier la Base de Données

Les collections MongoDB sont automatiquement créées. Collections principales :
- `users` : Utilisateurs
- `missions` : Missions disponibles
- `mission_submissions` : Soumissions de missions
- `transactions` : Historique des transactions

## 🛠️ Commandes Utiles

### Redémarrer les Services
```bash
sudo supervisorctl restart all        # Redémarre tout
sudo supervisorctl restart backend    # Redémarre seulement le backend
sudo supervisorctl restart frontend   # Redémarre seulement le frontend
```

### Voir les Logs
```bash
# Logs backend
tail -f /var/log/supervisor/backend.*.log

# Status des services
sudo supervisorctl status
```

### Installer de Nouvelles Dépendances

**Backend (Python)** :
```bash
cd /app/backend
pip install nouvelle-bibliotheque
echo "nouvelle-bibliotheque>=1.0.0" >> requirements.txt
sudo supervisorctl restart backend
```

**Frontend (Node.js)** :
```bash
cd /app/frontend
yarn add nouvelle-bibliotheque
sudo supervisorctl restart frontend
```

## 📊 Variables d'Environnement

### Backend (.env)
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="reality_plus"
JWT_SECRET="votre_secret_jwt"
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://votre-url-backend.com
```

## 🎨 Personnalisation Rapide

### Changer le Nom de l'App
1. **Frontend** : Dans `App.js`, changez "Reality+" par votre nom
2. **Backend** : Dans `server.py`, modifiez le titre de FastAPI

### Changer les Couleurs
Dans les composants React, remplacez :
- `from-blue-500 to-purple-600` par vos couleurs
- `bg-blue-500` par votre couleur principale

### Ajouter de Nouveaux Types de Récompenses
1. **Backend** : Ajoutez dans `Transaction.type`
2. **Frontend** : Créez l'interface correspondante

## 🚨 Points d'Attention

### Sécurité
- Changez `JWT_SECRET` en production
- Validez toujours les inputs utilisateur
- N'exposez jamais les clés API côté frontend

### Performance
- Les images sont stockées en Base64 (limitez la taille)
- Paginhez les listes longues
- Indexez les requêtes fréquentes MongoDB

### URLs et Ports
- **Ne jamais modifier** les URLs dans les .env
- Le backend écoute sur 0.0.0.0:8001
- Le frontend sur port 3000
- Utilisez toujours les variables d'environnement

## 🧪 Tests

### Tester les Endpoints Backend
```bash
# Test de base
curl https://votre-backend.com/api/health

# Test avec authentification
curl -H "Authorization: Bearer VOTRE_TOKEN" https://votre-backend.com/api/auth/me
```

### Vérifier les Services
```bash
sudo supervisorctl status
```

## 📞 Support et Résolution de Problèmes

### Problèmes Fréquents

**Backend ne démarre pas** :
```bash
tail -n 50 /var/log/supervisor/backend.*.log
```

**Frontend ne se charge pas** :
```bash
sudo supervisorctl restart frontend
```

**Base de données inaccessible** :
```bash
sudo supervisorctl restart mongodb
```

### Logs Utiles
- Backend : `/var/log/supervisor/backend.*.log`
- Frontend : `/var/log/supervisor/frontend.*.log`
- MongoDB : `/var/log/supervisor/mongodb.*.log`

## 🎯 Exemples d'Extensions

### Ajouter un Système de Notifications
1. Ajoutez un modèle `Notification` dans server.py
2. Créez les endpoints CRUD
3. Ajoutez le composant React pour l'affichage

### Système de Parrainage
1. Ajoutez `referral_code` au modèle User
2. Créez les endpoints de parrainage
3. Ajoutez les bonus de parrainage

### Missions Géolocalisées
1. Ajoutez `target_location` aux missions
2. Implémentez la validation de distance
3. Ajoutez une carte dans l'interface

---

**Cette documentation vous permet de modifier et étendre Reality+ selon vos besoins !** 🚀