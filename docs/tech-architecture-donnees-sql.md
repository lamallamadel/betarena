**TECH : Architecture de Données & Schéma SQL (Master DDL)**

**Version :** 1.2 (Format Granulaire)

**État :** Validé pour Production

**Moteur Cible :** PostgreSQL 15+ ou MySQL 8.0+

### ---

**1\. Domaine : Identité & Gamification (User Core)**

\-- Table des Utilisateurs

```SQL

CREATE TABLE users (  
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,  
    username VARCHAR(50) NOT NULL UNIQUE,  
    email VARCHAR(100) NOT NULL UNIQUE,  
    password\_hash VARCHAR(255) NOT NULL,  
    avatar\_url VARCHAR(255),  
      
    \-- Économie & Progression  
    wallet\_balance INT DEFAULT 500,  
    xp\_total INT DEFAULT 0,  
    current\_level INT DEFAULT 1,  
      
    \-- Parrainage & Acquisition  
    referral\_code VARCHAR(20) UNIQUE,  
    referred\_by\_user\_id BIGINT,  
      
    \-- Meta-données  
    is\_active BOOLEAN DEFAULT TRUE,  
    created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,  
    last\_login\_at TIMESTAMP,  
      
    FOREIGN KEY (referred\_by\_user\_id) REFERENCES users(id)  
);

```

\-- Catalogue de la Boutique Cosmétique


```SQL

CREATE TABLE shop\_items (  
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,  
    name VARCHAR(100) NOT NULL,  
    category ENUM('AVATAR', 'FRAME', 'TITLE', 'BADGE') NOT NULL,  
    price\_coins INT NOT NULL,  
    min\_level\_required INT DEFAULT 1,  
    asset\_url VARCHAR(255) NOT NULL,  
    is\_active BOOLEAN DEFAULT TRUE  
);

```
\-- Inventaire des Objets Cosmétiques


```SQL

CREATE TABLE user\_inventory (  
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,  
    user\_id BIGINT NOT NULL,  
    item\_id BIGINT NOT NULL,  
    is\_equipped BOOLEAN DEFAULT FALSE,  
    acquired\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,  
      
    FOREIGN KEY (user\_id) REFERENCES users(id),  
    FOREIGN KEY (item\_id) REFERENCES shop\_items(id)  
);

```
### ---

**2\. Domaine : Football Data (Truth Source)**

\-- Compétitions (Ligues)


```SQL

CREATE TABLE competitions (  
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,  
    name VARCHAR(100) NOT NULL,  
    country\_code VARCHAR(2),  
    logo\_url VARCHAR(255),  
      
    \-- Configuration  
    priority\_level INT DEFAULT 0,  
    has\_live\_standings BOOLEAN DEFAULT TRUE  
);


```
\-- Équipes Réelles


```SQL

CREATE TABLE teams (  
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,  
    name VARCHAR(100) NOT NULL,  
    short\_code VARCHAR(10),  
    logo\_url VARCHAR(255),  
    competition\_id BIGINT,  
      
    FOREIGN KEY (competition\_id) REFERENCES competitions(id)  
);


```

\-- Joueurs Réels (Source des cartes)


```SQL

CREATE TABLE real\_players (  
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,  
    team\_id BIGINT NOT NULL,  
    name VARCHAR(100) NOT NULL,  
    position ENUM('GK', 'DEF', 'MID', 'ATT') NOT NULL,  
    photo\_url VARCHAR(255),  
    is\_active BOOLEAN DEFAULT TRUE,  
      
    FOREIGN KEY (team\_id) REFERENCES teams(id)  
);

```
\-- Matchs (Calendrier & Scores)


```SQL

CREATE TABLE matches (  
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,  
    competition\_id BIGINT NOT NULL,  
    home\_team\_id BIGINT NOT NULL,  
    away\_team\_id BIGINT NOT NULL,  
      
    kickoff\_at TIMESTAMP NOT NULL,  
    status ENUM('SCHEDULED', 'LIVE', 'PAUSED', 'FINISHED', 'POSTPONED') DEFAULT 'SCHEDULED',  
      
    score\_home INT DEFAULT 0,  
    score\_away INT DEFAULT 0,  
      
    is\_manually\_locked BOOLEAN DEFAULT FALSE,  
      
    FOREIGN KEY (competition\_id) REFERENCES competitions(id),  
    FOREIGN KEY (home\_team\_id) REFERENCES teams(id),  
    FOREIGN KEY (away\_team\_id) REFERENCES teams(id)  
);


```
### ---

**3\. Domaine : Pronostics (Betting Core)**

\-- Table des Pronostics (1N2 & Score Exact)


```SQL

CREATE TABLE predictions (  
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,  
    user\_id BIGINT NOT NULL,  
    match\_id BIGINT NOT NULL,  
      
    type ENUM('1N2', 'EXACT\_SCORE') NOT NULL,  
    selection\_value VARCHAR(50) NOT NULL,  
      
    coins\_wagered INT NOT NULL,  
    potential\_gain INT,  
      
    status ENUM('PENDING', 'WON', 'LOST', 'VOID') DEFAULT 'PENDING',  
    coins\_won INT DEFAULT 0,  
      
    created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,  
      
    UNIQUE (user\_id, match\_id, type),  
    FOREIGN KEY (user\_id) REFERENCES users(id),  
    FOREIGN KEY (match\_id) REFERENCES matches(id)  
);


```
### ---

**4\. Domaine : Social & Préférences**

\-- Gestion des Favoris

```SQL

CREATE TABLE user\_favorites (  
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,  
    user\_id BIGINT NOT NULL,  
    entity\_type ENUM('TEAM', 'COMPETITION', 'MATCH') NOT NULL,  
    entity\_id BIGINT NOT NULL,  
    created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,  
      
    UNIQUE (user\_id, entity\_type, entity\_id),  
    FOREIGN KEY (user\_id) REFERENCES users(id)  
);

```

\-- Historique des Messages Chat


```SQL

CREATE TABLE chat\_messages (  
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,  
    room\_id VARCHAR(50) NOT NULL,  
    user\_id BIGINT NOT NULL,  
      
    content\_type ENUM('TEXT', 'GIF') DEFAULT 'TEXT',  
    content\_payload TEXT NOT NULL,  
      
    is\_hidden BOOLEAN DEFAULT FALSE,  
    created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,  
      
    FOREIGN KEY (user\_id) REFERENCES users(id)  
);


```
### ---

**5\. Domaine : Marketplace & Fantasy (Advanced)**

\-- Instances de Jeu (Sharding Rareté)

```SQL

CREATE TABLE game\_instances (  
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,  
    name VARCHAR(100),  
    max\_users INT DEFAULT 5000,  
    current\_users INT DEFAULT 0  
);


```

\-- Cartes Joueurs (NFTs / Assets)


```SQL

CREATE TABLE player\_cards (  
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,  
    real\_player\_id BIGINT NOT NULL,  
    instance\_id BIGINT NOT NULL,  
    owner\_id BIGINT,  
      
    scarcity ENUM('COMMON', 'RARE', 'EPIC', 'LEGENDARY') NOT NULL,  
    serial\_number INT NOT NULL,  
      
    is\_locked BOOLEAN DEFAULT FALSE,  
    created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,  
      
    FOREIGN KEY (real\_player\_id) REFERENCES real\_players(id),  
    FOREIGN KEY (instance\_id) REFERENCES game\_instances(id),  
    FOREIGN KEY (owner\_id) REFERENCES users(id)  
);

```
\-- Marché Secondaire (Listings P2P)


```SQL

CREATE TABLE market\_listings (  
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,  
    card\_id BIGINT NOT NULL,  
    seller\_id BIGINT NOT NULL,  
      
    price INT NOT NULL,  
    status ENUM('ACTIVE', 'SOLD', 'CANCELLED') DEFAULT 'ACTIVE',  
    created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,  
      
    FOREIGN KEY (card\_id) REFERENCES player\_cards(id),  
    FOREIGN KEY (seller\_id) REFERENCES users(id)  
);


```
\-- Journées de Championnat (Gameweeks)


```SQL

CREATE TABLE fantasy\_gameweeks (  
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,  
    number INT NOT NULL,  
    deadline\_at TIMESTAMP NOT NULL,  
    status ENUM('OPEN', 'LOCKED', 'FINISHED') DEFAULT 'OPEN'  
);

```
\-- Équipes Alignées (Lineups)


```SQL

CREATE TABLE fantasy\_lineups (  
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,  
    user\_id BIGINT NOT NULL,  
    gameweek\_id BIGINT NOT NULL,  
      
    formation VARCHAR(10) DEFAULT '4-3-3',  
    captain\_card\_id BIGINT,  
      
    total\_score INT DEFAULT 0,  
    created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,  
      
    FOREIGN KEY (user\_id) REFERENCES users(id),  
    FOREIGN KEY (gameweek\_id) REFERENCES fantasy\_gameweeks(id)  
);

```

\-- Détail des Joueurs dans l'Équipe


```SQL

CREATE TABLE lineup\_players (  
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,  
    lineup\_id BIGINT NOT NULL,  
    card\_id BIGINT NOT NULL,  
      
    position\_slot INT NOT NULL,  
    is\_subbed\_in BOOLEAN DEFAULT FALSE,  
      
    FOREIGN KEY (lineup\_id) REFERENCES fantasy\_lineups(id),  
    FOREIGN KEY (card\_id) REFERENCES player\_cards(id)  
);

```
### ---

**6\. Domaine : Administration & Sécurité**

\-- Utilisateurs Admin (Staff)


```SQL

CREATE TABLE admin\_users (  
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,  
    email VARCHAR(100) NOT NULL UNIQUE,  
    password\_hash VARCHAR(255) NOT NULL,  
    role ENUM('SUPER\_ADMIN', 'MODERATOR') NOT NULL,  
      
    two\_factor\_secret VARCHAR(255),  
    is\_2fa\_enabled BOOLEAN DEFAULT FALSE,  
    last\_login\_at TIMESTAMP  
);

```
\-- Logs d'Audit


```SQL

CREATE TABLE admin\_logs (  
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,  
    admin\_id BIGINT NOT NULL,  
    action\_type VARCHAR(50) NOT NULL,  
    target\_id BIGINT,  
    details\_json JSON,  
    ip\_address VARCHAR(45),  
    created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,  
      
    FOREIGN KEY (admin\_id) REFERENCES admin\_users(id)  
);  
