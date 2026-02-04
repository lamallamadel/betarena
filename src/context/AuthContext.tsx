import React, { createContext, useContext, useEffect, useState } from 'react';
import {type User, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db, APP_ID } from '../config/firebase';

// On définit le type ici ou on l'importe de ../types
export interface UserProfile {
    id: string;
    coins: number;
    pseudo: string;
    level: number;
    xp: number;
    inventory: string[];
    referralCode: string;
    referredBy?: string;
    lastDailyBonus: number;
    dailyShareCount: number;
    lastShareDate: string;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    isOnboarding: boolean; // <-- NOUVEAU : Dit si on doit afficher l'écran de bienvenue
    completeOnboarding: (pseudo: string, referralCode?: string) => Promise<void>; // <-- NOUVEAU : Action pour valider le pseudo
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOnboarding, setIsOnboarding] = useState(false);

    // 1. Connexion Firebase Anonyme
    useEffect(() => {
        signInAnonymously(auth).catch((err) => console.error("Auth Error", err));

        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            if (!u) setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. Écoute du Profil Firestore
    useEffect(() => {
        if (!user) return;

        const userRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'profile');

        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                // Le profil existe -> On charge les données et on cache l'onboarding
                setProfile({ id: user.uid, ...docSnap.data() } as UserProfile);
                setIsOnboarding(false);
            } else {
                // Le profil n'existe pas -> On déclenche le mode Onboarding
                setProfile(null);
                setIsOnboarding(true);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // 3. Fonction pour créer le profil (Appelée quand le joueur valide son pseudo)
    const completeOnboarding = async (pseudo: string, referralCodeInput?: string) => {
        if (!user) return;
        if (!pseudo.trim()) throw new Error("Pseudo requis");

        const userRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'profile');

        // Génération du code parrainage (ex: ZIZ-4921)
        const myReferralCode = `${pseudo.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Gestion Bonus Parrainage
        let startCoins = 500;
        let isReferred = false;
        if (referralCodeInput && referralCodeInput.length > 3) {
            startCoins += 200; // Bonus
            isReferred = true;
        }

        // Création du document
        await setDoc(userRef, {
            pseudo: pseudo.trim(),
            coins: startCoins,
            level: 1,
            xp: 0,
            inventory: [],
            referralCode: myReferralCode,
            referredBy: isReferred ? referralCodeInput : null,
            lastDailyBonus: 0,
            dailyShareCount: 0,
            lastShareDate: ''
        });
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, isOnboarding, completeOnboarding }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);