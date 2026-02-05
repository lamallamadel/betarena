CAHIER DES CHARGES FONCTIONNEL – APPLICATION FOOTBALL (PRONO & SOCIAL)
Version : 1.0 Auteur : L'Architecte Date : 04/02/2026

1. VISION DU PRODUIT
Application mobile (iOS/Android) centrée sur l'engagement des fans de football. Elle combine pronostics (Gamification), suivi de matchs en temps réel (Live Score) et interaction communautaire (Chat/Social). L'économie repose sur une monnaie virtuelle ("Coins Fun") sans argent réel.

2. MODULES FONCTIONNELS
MODULE A : PRONOSTICS (PREDICTIONS)
1. Objectif Permettre aux utilisateurs de miser des Coins sur l'issue des matchs.

2. Types de Pronostics

1N2 (Vainqueur) : Domicile (1), Nul (N), Extérieur (2).

Score Exact : Score numérique (ex: 2-1).

Événement Spécial : "Quel joueur va rater son tir au but ?" (Uniquement phases finales).

3. Règles de Gestion (Business Rules)

RG-A01 (Verrouillage 1N2) : La prise de pari 1N2 est strictement fermée à la seconde du coup d'envoi (kickoff_timestamp).

RG-A02 (Flexibilité Score Exact) : Le Score Exact est modifiable jusqu'au coup d'envoi de la 2ème mi-temps.

RG-A03 (Mise) : Chaque pronostic coûte un montant X de Coins (débit immédiat ou gel des fonds).

RG-A04 (Visibilité) :

Les choix des amis sont masqués jusqu'au début du match.

Les statistiques globales (% de votes sur 1/N/2) sont publiques en temps réel.

4. Flux Alternatifs

Solde insuffisant : Blocage de la validation avec message "Coins insuffisants".

Tentative de modification hors délai : Erreur bloquante "Les pronostics sont fermés".

MODULE B : MOTEUR DE RÉSOLUTION & CLASSEMENTS
1. Objectif Calculer les résultats des matchs, distribuer les gains et mettre à jour les classements.

2. Règles de Calcul

RG-B01 (Scope Résultat) : Le résultat pris en compte inclut le Temps Réglementaire + Prolongations + Tirs au But (Vainqueur final).

RG-B02 (Stratégies Configurables) : Le mode de calcul est défini par l'Admin selon la compétition :

Mode Cote : Gain = Mise x Cote (simulée).

Mode Forfait : Gain = Montant fixe (ex: 100 pts pour bon résultat, 500 pour score exact).

RG-B03 (Pari "Raté TAB") :

Gagnant si le joueur tire et rate.

Perdant si le joueur marque.

Annulé (Remboursé) si le joueur ne tire pas ou si pas de séance.

3. Classements (Leaderboards)

RG-B04 (Double Échelle) :

Classement Global : Historique depuis la création du compte.

Classement Saisonnier : Remise à zéro périodique.

RG-B05 (Égalité) : En cas d'égalité de Coins, le tri se fait par ordre alphabétique du Pseudo.

MODULE C : LIVE MATCH CENTER (FEED)
1. Objectif Fournir la "Vérité Terrain" en temps réel.

2. Flux de Données

Source : Provider externe (API-Football / SportMonks).

Affichage : Mise à jour automatique (Push/WebSocket). Pas de "Pull to refresh".

3. Contenu du Feed

Score & Chrono : En-tête fixe.

Timeline : Buts, Cartons (Jaune/Rouge), Remplacements, Corners, Touches, VAR.

Indicateurs : Animation visuelle forte lors d'un But.

4. Règles de Gestion

RG-C01 (Proxy) : L'application mobile ne requête JAMAIS le Provider en direct. Elle se connecte à notre Backend qui relaie les infos (Architecture Proxy pour sécurité et coûts).

RG-C02 (Annulation VAR) : Si un but est annulé par le provider, le système doit mettre à jour le score (décrémenter) et barrer l'événement dans la timeline.

MODULE D : CHAT & SOCIAL
1. Objectif Interaction communautaire pendant les matchs.

2. Structure des Canaux

Global : Chat unique général.

Match Room : Chat éphémère lié à un match spécifique.

Groupes Privés : Accessibles sur invitation uniquement.

3. Fonctionnalités & Contenu

Types de messages : Texte, Images (Upload), GIFs (Giphy/Tenor).

Droits d'accès :

Utilisateur Connecté : Lecture + Écriture.

Invité (Guest) : Lecture Seule (Read-only).

4. Modération

RG-D01 (Auto-Modération) : Filtrage bloquant (Regex) sur une liste de mots interdits (Insultes).

RG-D02 (Signalement) : Les utilisateurs peuvent signaler un message. À X signalements, le message est masqué en attente de review Admin.

MODULE E : GAMIFICATION & JOUEURS (PLAYERS FLOW)
1. Objectif Acquisition et Rétention des utilisateurs.

2. Parcours & Économie

Inscription & Parrainage :

Code parrain facultatif à l'inscription.

Bonus bilatéral (Parrain + Filleul reçoivent des Coins).

Sécurité : Limitation par Device ID pour éviter la fraude.

Niveaux (XP) :

Gain d'XP par actions (Connexion, Prono, Partage).

La montée de niveau débloque l'accès à certains items.

Boutique (Shop) :

Achat d'Avatars et Cadres de profil avec les Coins.

Inventaire permanent (pas de revente).

3. Profil Utilisateur

Affichage : Avatar, Niveau (Jauge XP), Stats (Win Rate), Historique Pronos.

MODULE F : PARTAGE SOCIAL (VIRALITÉ)
1. Objectif Exportation des succès hors de l'application.

2. Fonctionnalités

Génération d'Image : Création locale d'une image native (JPG/PNG) format "Story" (9:16).

Contenu de l'image : Score/Prono + Pseudo + Logo App + QR Code/Lien Store.

3. Règles de Gestion

RG-F01 (Incentive) : Récompense (ex: +10 Coins) au déclenchement du partage.

RG-F02 (Limites) : Plafonné à X partages rémunérés par jour (ex: 3 max) pour éviter le spam.

MODULE G : BACK-OFFICE (ADMINISTRATION)
1. Objectif Pilotage, Configuration et Gestion de Crise.

2. Gestion des Rôles (RBAC)

Super Admin : Accès complet (Finance, Config, Users).

Modérateur : Accès restreint (Chat, Ban User). Interdiction de toucher aux Coins/Scores.

3. Fonctionnalités Clés

Override Score : Possibilité de forcer manuellement un score si l'API est défaillante. Cette action verrouille le match et déclenche le calcul des gains.

Support Client : Crédit/Débit manuel de Coins sur un utilisateur (avec log obligatoire du motif).

Marketing Push : Envoi de notifications ciblées par "Équipe Favorite".

4. Logs & Sécurité

RG-G01 (Audit) : Toutes les actions Admin (Modification solde, Override score) sont enregistrées dans une table Logs immuable.

3. CRITÈRES TECHNIQUES GLOBAUX
Plateformes : iOS & Android (Cross-platform recommandé : Flutter ou React Native).

Connectivité : Application "Online First".

Temps Réel : Utilisation obligatoire de WebSockets pour le Chat et le Live Feed.

Format des échanges : JSON REST pour les actions transactionnelles (Pronos, Shop).