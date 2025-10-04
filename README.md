# 📖 Bible Explorer

![Bible Explorer Banner](./public/banner.png)

## 🌍 Démo en ligne

👉 [Accéder à la démo sur Netlify](https://angele-kaloi-bible-explorer.netlify.app)

---

## 🚀 Présentation

**Bible Explorer** est une application interactive en **React + Three.js (React-Three-Fiber)** permettant d’explorer la Bible de façon visuelle et immersive.  
L’utilisateur navigue depuis une **Bible 3D flottante** jusqu’à une **sphère des livres**, puis aux chapitres et versets via l’API [scripture.api.bible](https://scripture.api.bible/).

Objectif : rendre la lecture de la Bible intuitive, immersive et accessible via un simple navigateur.

---

## ✨ Fonctionnalités

- 📖 **Modèle 3D interactif** : une Bible animée s’ouvre au clic.  
- 🌐 **Sphère des livres** : chaque livre apparaît comme un nœud cliquable.  
- 🔢 **Chapitres défilants** : navigation fluide dans les chapitres d’un livre.  
- 📜 **Lecteur de versets** : affichage clair du texte biblique.  
- 🎨 **UI immersive** avec **React-Three-Fiber** et **drei**.  
- 🔑 **Connexion API sécurisée** via variables d’environnement (clé API, ID Bible).  
- ☁️ **Déploiement automatique** via Netlify (CI/CD).

---

## 🖼️ Schéma de fonctionnement

## 🖼️ Schéma simplifié

```mermaid
flowchart TD

    U[Utilisateur - Navigateur] --> A[Bible Explorer - React + R3F]
    A -->|fetch REST JSON| API[Scripture API - api.bible]

    subgraph A [Bible Explorer]
        L[LandingPage - Bible 3D]
        B[BooksPage - Livres]
        C[ChaptersPage - Chapitres]
        R[ReaderPage - Versets]
        L --> B --> C --> R
    end


---

## 🛠️ Stack technique

- **React 18** + **Vite**
- **React-Three-Fiber** + **drei**
- **Three.js**
- **React Router DOM**
- **Scripture API** (api.bible)
- **Netlify** (hébergement + CI/CD)
- **GitHub** (repo + versioning)

---

## 📂 Structure du projet

```
bible-explorer/
├── public/                  # fichiers statiques (favicon, assets 3D, …)
│   └── holy-bible.glb
├── src/
│   ├── components/          # composants React 3D (Bible, UI, …)
│   ├── pages/               # pages principales (Landing, Books, Chapters, Reader)
│   ├── BibleExplorer.jsx    # ApiProvider + Context
│   └── main.jsx             # point d'entrée
├── docs/                    # docs + schéma d’archi
│   └── bible-explorer-schema-v1.png
├── .env.example             # modèle de configuration des clés
├── vite.config.js
├── package.json
└── README.md
```

---

## ⚙️ Installation locale

### 1. Cloner le repo
```bash
git clone https://github.com/angelkae7/bible-explorer.git
cd bible-explorer
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer les variables d’environnement
Créer un fichier `.env.local` à la racine avec :

```env
VITE_BIBLE_API_KEY=ta_clef_api
VITE_BIBLE_ID=a93a92589195411f-01   # Exemple : Bible Darby (FR)
```

### 4. Lancer en développement
```bash
npm run dev
```

👉 L’application sera dispo sur [http://localhost:5173](http://localhost:5173)

### 5. Build de production
```bash
npm run build
```

---

## 🔑 Sources & Ressources

- [Scripture API](https://scripture.api.bible/)  
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)  
- [drei helpers](https://github.com/pmndrs/drei)  
- [Three.js](https://threejs.org/)  

---

## 👩‍💻 Auteur

Projet développé par **Angèle KALOÏ** dans le cadre du BUT MMI – 2025.  
Encadré par *François Gillet*.  

📫 Contact : [angelekaloi@gmail.com](mailto:angelekaloi@gmail.com)
