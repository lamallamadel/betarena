import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, orderBy, limit, getDocs, writeBatch } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, APP_ID } from '../config/firebase';
import type { SyncJob, SyncJobType, ApiHealthStatus } from '../types/types';

const RETRY_DELAYS = [30000, 60000, 300000, 900000]; // 30s, 1m, 5m, 15m
const MAX_ATTEMPTS = 5;

export interface OfflineNotificationCallback {
    (message: string, type: 'success' | 'warning' | 'error' | 'info'): void;
}

export const useSyncQueue = (onNotification?: OfflineNotificationCallback) => {
    const [jobs, setJobs] = useState<SyncJob[]>([]);
    const [apiHealth, setApiHealth] = useState<ApiHealthStatus>({
        isOnline: true,
        consecutiveFailures: 0,
    });
    const [processing, setProcessing] = useState(false);
    const prevHealthRef = useRef<ApiHealthStatus | null>(null);

    const functions = getFunctions();

    // Listen to sync jobs queue
    useEffect(() => {
        const jobsRef = collection(db, 'artifacts', APP_ID, 'admin', 'sync_queue', 'jobs');
        const q = query(
            jobsRef,
            where('status', 'in', ['PENDING', 'RETRYING', 'FAILED']),
            orderBy('nextRetry', 'asc'),
            limit(50)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const jobsList: SyncJob[] = [];
            snapshot.forEach((docSnap) => {
                jobsList.push({ id: docSnap.id, ...docSnap.data() } as SyncJob);
            });
            setJobs(jobsList);
        }, (error) => {
            console.error('Error listening to sync queue:', error);
        });

        return () => unsub();
    }, []);

    // Listen to API health status and notify on changes
    useEffect(() => {
        const healthRef = doc(db, 'artifacts', APP_ID, 'admin', 'api_health', 'status', 'current');
        
        const unsub = onSnapshot(healthRef, (docSnap) => {
            if (docSnap.exists()) {
                const newHealth = docSnap.data() as ApiHealthStatus;
                const prevHealth = prevHealthRef.current;
                
                // Notify on status changes
                if (prevHealth && onNotification) {
                    // API went offline
                    if (prevHealth.isOnline && !newHealth.isOnline) {
                        onNotification('Connexion API perdue - Mode hors ligne activé', 'error');
                    }
                    // API came back online
                    else if (!prevHealth.isOnline && newHealth.isOnline) {
                        onNotification('Connexion API rétablie', 'success');
                    }
                    // Warning on consecutive failures
                    else if (newHealth.consecutiveFailures > 0 && newHealth.consecutiveFailures !== prevHealth.consecutiveFailures) {
                        if (newHealth.consecutiveFailures === 1) {
                            onNotification('Ralentissement détecté - Données en cache', 'warning');
                        } else if (newHealth.consecutiveFailures === 2) {
                            onNotification('Problème de connexion persistant', 'warning');
                        }
                    }
                }
                
                setApiHealth(newHealth);
                prevHealthRef.current = newHealth;
            }
        }, (error) => {
            console.error('Error listening to API health:', error);
        });

        return () => unsub();
    }, [onNotification]);

    // Add job to queue
    const queueJob = useCallback(async (
        type: SyncJobType,
        params: Record<string, any>
    ): Promise<string> => {
        const jobId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const job: SyncJob = {
            id: jobId,
            type,
            status: 'PENDING',
            params,
            attempts: 0,
            maxAttempts: MAX_ATTEMPTS,
            nextRetry: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const jobRef = doc(db, 'artifacts', APP_ID, 'admin', 'sync_queue', 'jobs', jobId);
        await setDoc(jobRef, job);

        return jobId;
    }, []);

    // Process a single job
    const processJob = useCallback(async (job: SyncJob): Promise<boolean> => {
        const jobRef = doc(db, 'artifacts', APP_ID, 'admin', 'sync_queue', 'jobs', job.id);

        try {
            // Update status to retrying
            await updateDoc(jobRef, {
                status: 'RETRYING',
                attempts: job.attempts + 1,
                lastAttempt: Date.now(),
                updatedAt: Date.now(),
            });

            switch (job.type) {
                case 'FIXTURES': {
                    const syncFixtures = httpsCallable(functions, 'syncFixtures');
                    await syncFixtures(job.params);
                    break;
                }
                case 'LIVE_MATCH': {
                    const syncLiveMatch = httpsCallable(functions, 'syncLiveMatch');
                    await syncLiveMatch(job.params);
                    break;
                }
                case 'LIVE_ALL': {
                    const syncAllLive = httpsCallable(functions, 'syncAllLive');
                    await syncAllLive({});
                    break;
                }
                case 'STANDINGS': {
                    const syncStandings = httpsCallable(functions, 'syncStandings');
                    await syncStandings(job.params);
                    break;
                }
                default:
                    throw new Error(`Unknown job type: ${job.type}`);
            }

            // Success - mark as completed
            await updateDoc(jobRef, {
                status: 'COMPLETED',
                updatedAt: Date.now(),
            });

            // Update API health
            const healthRef = doc(db, 'artifacts', APP_ID, 'admin', 'api_health', 'status');
            await setDoc(healthRef, {
                isOnline: true,
                lastSuccessfulCall: Date.now(),
                consecutiveFailures: 0,
            }, { merge: true });

            return true;
        } catch (error: any) {
            console.error(`Job ${job.id} failed:`, error);

            const newAttempts = job.attempts + 1;
            const shouldRetry = newAttempts < MAX_ATTEMPTS;

            if (shouldRetry) {
                // Schedule next retry with exponential backoff
                const delay = RETRY_DELAYS[Math.min(newAttempts - 1, RETRY_DELAYS.length - 1)];
                await updateDoc(jobRef, {
                    status: 'PENDING',
                    attempts: newAttempts,
                    nextRetry: Date.now() + delay,
                    error: error.message || 'Unknown error',
                    updatedAt: Date.now(),
                });
            } else {
                // Max attempts reached - mark as failed
                await updateDoc(jobRef, {
                    status: 'FAILED',
                    attempts: newAttempts,
                    error: error.message || 'Max attempts exceeded',
                    updatedAt: Date.now(),
                });
            }

            // Update API health
            const healthRef = doc(db, 'artifacts', APP_ID, 'admin', 'api_health', 'status');
            const currentHealth = apiHealth.consecutiveFailures + 1;
            await setDoc(healthRef, {
                isOnline: currentHealth < 3,
                consecutiveFailures: currentHealth,
                lastError: error.message,
                estimatedRecoveryTime: Date.now() + RETRY_DELAYS[Math.min(currentHealth, RETRY_DELAYS.length - 1)],
            }, { merge: true });

            return false;
        }
    }, [functions, apiHealth]);

    // Process pending jobs
    const processQueue = useCallback(async () => {
        if (processing) return;

        setProcessing(true);
        try {
            // Get jobs ready for retry
            const now = Date.now();
            const readyJobs = jobs.filter(job => 
                (job.status === 'PENDING' || job.status === 'RETRYING') &&
                (!job.nextRetry || job.nextRetry <= now)
            );

            for (const job of readyJobs) {
                await processJob(job);
                // Small delay between jobs to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } finally {
            setProcessing(false);
        }
    }, [jobs, processing, processJob]);

    // Auto-process queue every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            processQueue();
        }, 30000);

        // Initial process
        processQueue();

        return () => clearInterval(interval);
    }, [processQueue]);

    // Retry a failed job
    const retryJob = useCallback(async (jobId: string) => {
        const jobRef = doc(db, 'artifacts', APP_ID, 'admin', 'sync_queue', 'jobs', jobId);
        await updateDoc(jobRef, {
            status: 'PENDING',
            nextRetry: Date.now(),
            updatedAt: Date.now(),
        });
    }, []);

    // Clear completed jobs
    const clearCompleted = useCallback(async () => {
        const jobsRef = collection(db, 'artifacts', APP_ID, 'admin', 'sync_queue', 'jobs');
        const q = query(
            jobsRef,
            where('status', '==', 'COMPLETED'),
            limit(100)
        );

        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.forEach((docSnap) => {
            batch.delete(docSnap.ref);
        });
        await batch.commit();
    }, []);

    return {
        jobs,
        apiHealth,
        queueJob,
        processQueue,
        retryJob,
        clearCompleted,
        pendingCount: jobs.filter(j => j.status === 'PENDING' || j.status === 'RETRYING').length,
        failedCount: jobs.filter(j => j.status === 'FAILED').length,
    };
};
