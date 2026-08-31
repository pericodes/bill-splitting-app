"use client";

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { useStore } from '@/data/store';
import Header from '@/components/layout/Header';
import { useAlert } from '@/components/common/AlertProvider';
import { getAccountData, addParticipantAction, updateParticipantNameAction, removeParticipantAction } from '@/actions/app';

export default function ParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const { currentUser, setCurrentUser } = useStore();
  const { showAlert, showConfirm } = useAlert();
  
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const res = await getAccountData(id);
    if (res.success && res.account) {
      setAccount(res.account);
      setUsers(res.users || []);
      setMembers(res.members || []);
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!currentUser) {
      router.push('/');
      return;
    }
    
    const load = async () => {
      try {
        const ok = await fetchData();
        if (!ok) {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [id, currentUser, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!account) return null;

  const accountMembers = members.map(m => {
    const user = users.find(u => u.id === (m.userId || m.user_id));
    return { ...m, user };
  }).filter(m => m.user !== undefined);

  const memberDisplayName = (m: any) => (m.user?.displayName || m.user?.display_name || '').trim();

  const nameAlreadyUsed = (name: string, exceptUserId?: string | null) =>
    accountMembers.some(m => {
      const userId = m.userId || m.user_id;
      if (exceptUserId && userId === exceptUserId) return false;
      return memberDisplayName(m).toLowerCase() === name.toLowerCase();
    });

  const openAddDialog = () => {
    setDialogMode('add');
    setEditingUserId(null);
    setNameInput('');
    setDialogOpen(true);
  };

  const openEditDialog = (userId: string, currentName: string) => {
    setDialogMode('edit');
    setEditingUserId(userId);
    setNameInput(currentName);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setNameInput('');
    setEditingUserId(null);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name || saving) return;

    if (nameAlreadyUsed(name, dialogMode === 'edit' ? editingUserId : null)) {
      showAlert({
        title: "Nombre duplicado",
        description: `Ya hay un participante llamado ${name} en esta cuenta.`,
      });
      return;
    }

    setSaving(true);
    try {
      if (dialogMode === 'add') {
        const res = await addParticipantAction(id, name);
        if (!res.success) {
          showAlert({ title: "Error", description: res.error || "No se pudo añadir el participante." });
          return;
        }
      } else if (editingUserId) {
        const res = await updateParticipantNameAction(id, editingUserId, name);
        if (!res.success) {
          showAlert({ title: "Error", description: res.error || "No se pudo actualizar el nombre." });
          return;
        }
        if (currentUser && editingUserId === currentUser.id) {
          setCurrentUser({ ...currentUser, display_name: name });
        }
      }
      closeDialog();
      await fetchData();
    } catch (err: any) {
      showAlert({ title: "Error", description: err.message || "No se pudo guardar." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (userId: string, name: string) => {
    showConfirm({
      title: "Eliminar participante",
      description: `¿Quieres eliminar a ${name} de esta cuenta?`,
      isDestructive: true,
      confirmText: "Eliminar",
      onConfirm: async () => {
        const res = await removeParticipantAction(id, userId);
        if (!res.success) {
          showAlert({ title: "Error", description: res.error || "No se pudo eliminar el participante." });
          return;
        }
        await fetchData();
      },
    });
  };

  return (
    <div className="bg-background text-on-background min-h-screen font-body-lg flex flex-col pt-16">
      <Header title="Participantes" showBack />
      
      <main className="flex-grow px-4 py-6 max-w-3xl mx-auto w-full">
        <div className="space-y-2 mb-6">
          {accountMembers.map(m => {
            const userId = m.userId || m.user_id;
            const name = memberDisplayName(m);
            const isSelf = userId === currentUser?.id;
            const isOwner = m.role === 'owner';
            const canDelete = !isSelf && !isOwner;

            return (
              <div key={m.id} className="bg-surface-container-lowest border border-outline-variant shadow-sm rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="min-w-0">
                    <p className="font-semibold text-base text-on-surface truncate">
                      {name} {isSelf ? "(tú)" : ""}
                    </p>
                    <p className="text-sm text-on-surface-variant">
                      {m.user?.isGhost || m.user?.is_ghost ? "Invitado" : "Registrado"} • {isOwner ? "Creador" : "Miembro"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    aria-label={`Editar ${name}`}
                    onClick={() => openEditDialog(userId, name)}
                    className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-high focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      aria-label={`Eliminar ${name}`}
                      onClick={() => handleDelete(userId, name)}
                      className="text-on-surface-variant hover:text-error transition-colors p-2 rounded-full hover:bg-error-container/50 focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Dialog.Root open={dialogOpen} onOpenChange={(open) => {
          if (open) {
            setDialogOpen(true);
          } else {
            closeDialog();
          }
        }}>
          <button
            type="button"
            onClick={openAddDialog}
            className="w-full py-3 border border-dashed border-primary text-primary rounded-lg font-semibold text-sm tracking-wider transition-colors hover:bg-primary-fixed-dim/10 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Añadir participantes
          </button>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
            <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-6 shadow-lg z-50">
              <Dialog.Title className="text-xl font-bold text-on-surface">
                {dialogMode === 'add' ? 'Añadir participante' : 'Editar participante'}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-on-surface-variant">
                {dialogMode === 'add'
                  ? 'Añádelo por su nombre para incluirlo en los gastos. Podrá unirse más tarde con el enlace de invitación.'
                  : 'Cambia el nombre con el que aparece en esta cuenta.'}
              </Dialog.Description>
              <form onSubmit={handleSaveName} className="mt-4 flex flex-col gap-4">
                <input
                  type="text"
                  autoFocus
                  required
                  maxLength={60}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Nombre (Ej. Laura)"
                  disabled={saving}
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
                <div className="flex justify-end gap-3">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      disabled={saving}
                      className="px-4 py-2 rounded-lg font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={saving || !nameInput.trim()}
                    className="px-4 py-2 rounded-lg font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {saving
                      ? (dialogMode === 'add' ? 'Añadiendo...' : 'Guardando...')
                      : (dialogMode === 'add' ? 'Añadir' : 'Guardar')}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <Link
          href={`/account/${id}/share`}
          className="mt-3 w-full py-3 text-on-surface-variant hover:text-primary rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">share</span>
          Invitar con un enlace
        </Link>
      </main>
    </div>
  );
}
