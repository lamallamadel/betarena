import { useState, useEffect, useRef } from 'react';
import { collection, query, where, limit, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import type { MessageType } from "../types/types.ts";


// RG-D01 : Auto-Modération (Liste basique à étendre)
const BLACKLIST = ["merde", "arnaque", "connard", "salaud", "escroc"];

export const useChat = (roomId: string, user: any, profile: any, isGuest: boolean) => {
  const [messages, setMessages] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastMessageTimeRef = useRef<number>(0);

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

    // RG-D01 : Regex Filter
    if (type === 'TEXT' && BLACKLIST.some(w => content.toLowerCase().includes(w))) {
      throw new Error("Message bloqué : Contenu inapproprié");
    }

    lastMessageTimeRef.current = now;

    await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'messages'), {
      roomId,
      userId: user.uid,
      pseudo: profile?.pseudo || 'Anonyme',
      type, content,
      timestamp: Date.now(),
      isReported: false, reportCount: 0 // RG-D02 Préparation
    });
  };

  const reportMessage = async (messageId: string) => {
    if (!user) return;
    const msgRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'messages', messageId);
    await updateDoc(msgRef, {
      isReported: true,
      reportCount: 1 // Simple increment logic would need transaction for real app
    });
  };

  return { messages, sendMessage, reportMessage, chatEndRef };
};