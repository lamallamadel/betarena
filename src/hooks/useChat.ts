import { useState, useEffect, useRef } from 'react';
import { collection, query, where, limit, onSnapshot, addDoc, doc, setDoc, deleteDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import type { MessageType } from "../types/types.ts";


// RG-D01 : Auto-Modération (Liste basique à étendre)
const BLACKLIST = ["merde", "arnaque", "connard", "salaud", "escroc"];
// RG-D01 : Max 280 caractères par message
const MAX_MESSAGE_LENGTH = 280;
// RG-D02 : Seuil auto-hide après X signalements
const AUTO_HIDE_REPORT_THRESHOLD = 3;

export const useChat = (roomId: string, user: any, profile: any, isGuest: boolean) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [usersOnline, setUsersOnline] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastMessageTimeRef = useRef<number>(0);

  // Presence tracking - mark user as online in room
  useEffect(() => {
    if (!user?.uid || isGuest || !roomId) return;

    const presenceRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'presence', `${roomId}_${user.uid}`);

    // Set presence on mount
    setDoc(presenceRef, {
      roomId,
      odId: user.uid,
      pseudo: profile?.pseudo || 'Anonyme',
      timestamp: serverTimestamp()
    });

    // Remove presence on unmount
    return () => {
      deleteDoc(presenceRef).catch(() => { });
    };
  }, [roomId, user?.uid, profile?.pseudo, isGuest]);

  // Listen to online users count
  useEffect(() => {
    if (!roomId) return;

    const presenceQuery = query(
      collection(db, 'artifacts', APP_ID, 'public', 'data', 'presence'),
      where('roomId', '==', roomId)
    );

    const unsubscribe = onSnapshot(presenceQuery, (snapshot) => {
      setUsersOnline(snapshot.size);
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    if (!user) return;
    // Canal Global vs Match Room (Module D.2)
    const q = query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'messages'), where('roomId', '==', roomId), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      msgs.sort((a: any, b: any) => a.timestamp - b.timestamp);
      setMessages(msgs);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsubscribe();
  }, [roomId, user]);

  const sendMessage = async (content: string, type: MessageType = 'TEXT') => {
    if (!content.trim() || !user) return;

    // Droits d'accès (Module D.3)
    if (isGuest) throw new Error("Mode Invité : Lecture seule");

    // RG-D03 : Check Anti-Flood (2s)
    const now = Date.now();
    if (lastMessageTimeRef.current && now - lastMessageTimeRef.current < 2000) {
      throw new Error("Veuillez ralentir (2s entre messages)");
    }

    // RG-D01 : Limite 280 caractères
    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Message trop long (max ${MAX_MESSAGE_LENGTH} caractères)`);
    }

    // RG-D01 : Regex Filter
    if (type === 'TEXT' && BLACKLIST.some(w => content.toLowerCase().includes(w))) {
      throw new Error("Message bloqué : Contenu inapproprié");
    }

    lastMessageTimeRef.current = now;

    await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'messages'), {
      roomId,
      odId: user.uid,
      pseudo: profile?.pseudo || 'Anonyme',
      type, content,
      timestamp: Date.now(),
      isReported: false, reportCount: 0 // RG-D02 Préparation
    });
  };

  // RG-D02 : Signalement avec auto-hide après X reports (atomic)
  const reportMessage = async (messageId: string) => {
    if (!user) return;
    const msgRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'messages', messageId);

    await runTransaction(db, async (t) => {
      const msgDoc = await t.get(msgRef);
      if (!msgDoc.exists()) return;

      const data = msgDoc.data();
      const newCount = (data.reportCount || 0) + 1;
      const isHidden = newCount >= AUTO_HIDE_REPORT_THRESHOLD;

      t.update(msgRef, {
        reportCount: newCount,
        isReported: true,
        isHidden, // Auto-hide si seuil atteint
      });
    });
  };

  return { messages, sendMessage, reportMessage, chatEndRef, usersOnline, isGuest };
};
