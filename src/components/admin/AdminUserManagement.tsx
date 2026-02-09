import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, UserMinus, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useAdminManagement } from '../../hooks/useAdminManagement';
import { useAuth } from '../../context/AuthContext';

interface AdminUser {
  uid: string;
  pseudo: string;
  level: number;
  adminGrantedAt?: { seconds: number };
  adminGrantedBy?: string;
}

export const AdminUserManagement: React.FC = () => {
  const { isAdmin } = useAuth();
  const { grantAdmin, revokeAdmin, listAdmins, loading, error } = useAdminManagement();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const loadAdmins = React.useCallback(async () => {
    setIsLoadingList(true);
    const adminList = await listAdmins();
    setAdmins(adminList);
    setIsLoadingList(false);
  }, [listAdmins]);

  // Load admin list on mount
  useEffect(() => {
    let active = true;
    if (isAdmin) {
      const fetch = async () => {
        if (!active) return;
        await loadAdmins();
      };
      fetch();
    }
    return () => { active = false; };
  }, [isAdmin, loadAdmins]);

  const handleGrantAdmin = async () => {
    if (!targetUserId.trim()) {
      setMessage({ type: 'error', text: 'Veuillez entrer un ID utilisateur' });
      return;
    }

    const result = await grantAdmin(targetUserId.trim());
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Accès admin accordé avec succès' });
      setTargetUserId('');
      await loadAdmins();
    } else {
      setMessage({ type: 'error', text: result.message || 'Échec de l\'octroi d\'accès admin' });
    }
  };

  const handleRevokeAdmin = async (userId: string, pseudo: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir révoquer l'accès admin de ${pseudo}?`)) {
      return;
    }

    const result = await revokeAdmin(userId);
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Accès admin révoqué avec succès' });
      await loadAdmins();
    } else {
      setMessage({ type: 'error', text: result.message || 'Échec de la révocation d\'accès admin' });
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-slate-400">Accès refusé. Droits administrateur requis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-indigo-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Gestion des Administrateurs</h2>
            <p className="text-slate-400 text-sm">Gérer les accès administrateurs de l'application</p>
          </div>
        </div>
      </div>

      {/* Message display */}
      {message && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-green-500/20 border-green-500/30 text-green-400' 
            : 'bg-red-500/20 border-red-500/30 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Grant Admin Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-emerald-400" />
          Accorder l'accès administrateur
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              ID Utilisateur
            </label>
            <input
              type="text"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="Entrez l'ID utilisateur (UID)"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <p className="text-xs text-slate-500 mt-2">
              Vous pouvez trouver l'UID dans la console Firebase ou dans les logs admin
            </p>
          </div>

          <button
            onClick={handleGrantAdmin}
            disabled={loading || !targetUserId.trim()}
            className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            {loading ? 'En cours...' : 'Accorder l\'accès admin'}
          </button>
        </div>
      </div>

      {/* Admin List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-400" />
            Administrateurs actuels ({admins.length})
          </h3>
          <button
            onClick={loadAdmins}
            disabled={isLoadingList}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingList ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {isLoadingList ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            Aucun administrateur trouvé
          </div>
        ) : (
          <div className="space-y-3">
            {admins.map((admin) => (
              <div
                key={admin.uid}
                className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-indigo-400" />
                      <div>
                        <p className="font-bold text-white">{admin.pseudo}</p>
                        <p className="text-xs text-slate-500 font-mono">{admin.uid}</p>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      <span>Niveau {admin.level}</span>
                      {admin.adminGrantedAt && (
                        <span className="ml-3">
                          Admin depuis: {new Date(admin.adminGrantedAt.seconds * 1000).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeAdmin(admin.uid, admin.pseudo)}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <UserMinus className="w-4 h-4" />
                    Révoquer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-200">
            <p className="font-bold mb-1">Note de sécurité</p>
            <ul className="space-y-1 text-amber-300/80">
              <li>• Les administrateurs ont accès complet à toutes les données</li>
              <li>• Toutes les actions admin sont enregistrées dans les logs</li>
              <li>• Vous ne pouvez pas révoquer votre propre accès admin</li>
              <li>• Seuls les administrateurs peuvent voir cette page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
