import { useCallback, useEffect, useState } from "react";
import { UserPlus, Users as UsersIcon, Trash2, TriangleAlert, Pencil, Check, X } from "lucide-react";
import { Card, CardHeader } from "../ui/Card.jsx";
import { Badge } from "../ui/Badge.jsx";
import { Button } from "../ui/Button.jsx";
import { useAuth } from "../../context/AuthProvider.jsx";
import { getUsers, postUser, putUser, deleteUser, USE_MOCK_DATA } from "../../lib/api.js";
import { mockUsers } from "../../data/mockData.js";

const inputClass =
  "focus-ring w-full rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint";

const EMPTY_FORM = { name: "", username: "", password: "", role: "Operador" };

export function UsersPanel() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState(USE_MOCK_DATA ? mockUsers : []);
  const [loading, setLoading] = useState(!USE_MOCK_DATA);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", role: "Operador" });
  const [savingId, setSavingId] = useState(null);

  const refresh = useCallback(async () => {
    if (USE_MOCK_DATA) return;
    try {
      setUsers(await getUsers());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      if (USE_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 300));
        setUsers((prev) => [...prev, { id: Date.now(), active: true, ...form }]);
      } else {
        await postUser(form);
        await refresh();
      }
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (u) => {
    setError(null);
    setEditingId(u.id);
    setEditForm({ name: u.name, role: u.role });
  };

  const cancelEdit = () => setEditingId(null);

  const handleUpdate = async (u) => {
    setError(null);
    setSavingId(u.id);
    try {
      if (USE_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 300));
        setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...editForm } : x)));
      } else {
        await putUser(u.id, editForm);
        await refresh();
      }
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`¿Eliminar al usuario "${u.username}"? Esta acción no se puede deshacer.`)) return;
    setError(null);
    setDeletingId(u.id);
    try {
      if (USE_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 300));
        setUsers((prev) => prev.filter((x) => x.id !== u.id));
      } else {
        await deleteUser(u.id);
        await refresh();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-coral-100 bg-coral-50 px-3.5 py-2.5 text-xs text-coral-600">
          <TriangleAlert size={14} strokeWidth={2} className="shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader icon={UserPlus} title="Nuevo usuario" subtitle="Crea una cuenta de acceso al dashboard" />
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Nombre</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Jose Rodriguez"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Usuario</label>
            <input
              required
              minLength={3}
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="jrodriguez"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Contraseña</label>
            <input
              required
              minLength={6}
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Mínimo 6 caracteres"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Rol</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className={inputClass}
            >
              <option value="Operador">Operador</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" variant="primary" icon={UserPlus} disabled={creating}>
              {creating ? "Creando..." : "Crear usuario"}
            </Button>
          </div>
        </form>
      </Card>

      <Card padded={false}>
        <div className="px-5 pt-5">
          <CardHeader icon={UsersIcon} title="Usuarios" subtitle="Cuentas con acceso al dashboard" />
        </div>
        {loading ? (
          <p className="px-5 pb-5 text-sm text-ink-faint">Cargando usuarios...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-line text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-2.5 font-medium">Nombre</th>
                  <th className="px-3 py-2.5 font-medium">Usuario</th>
                  <th className="px-3 py-2.5 font-medium">Rol</th>
                  <th className="px-3 py-2.5 font-medium text-right pr-5">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id || u.username === currentUser?.username;
                  const isEditing = editingId === u.id;
                  const rowBusy = deletingId === u.id || savingId === u.id;

                  if (isEditing) {
                    return (
                      <tr key={u.id} className="border-b border-line last:border-0 bg-panel-alt/40">
                        <td className="px-5 py-2.5">
                          <input
                            autoFocus
                            value={editForm.name}
                            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                            className={inputClass}
                          />
                        </td>
                        <td className="px-3 py-2.5 text-ink-soft">{u.username}</td>
                        <td className="px-3 py-2.5">
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                            className={inputClass}
                          >
                            <option value="Operador">Operador</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-3 py-2.5 pr-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="soft"
                              size="sm"
                              icon={X}
                              disabled={savingId === u.id}
                              onClick={cancelEdit}
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              icon={Check}
                              disabled={!editForm.name.trim() || savingId === u.id}
                              onClick={() => handleUpdate(u)}
                            >
                              {savingId === u.id ? "Guardando..." : "Guardar"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={u.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-2.5 text-ink">{u.name}</td>
                      <td className="px-3 py-2.5 text-ink-soft">{u.username}</td>
                      <td className="px-3 py-2.5">
                        <Badge tone={u.role === "Admin" ? "info" : "neutral"}>{u.role}</Badge>
                      </td>
                      <td className="px-3 py-2.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="soft"
                            size="sm"
                            icon={Pencil}
                            disabled={rowBusy || editingId !== null}
                            title="Editar usuario"
                            onClick={() => startEdit(u)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            disabled={isSelf || rowBusy || editingId !== null}
                            title={isSelf ? "No puedes eliminar tu propio usuario" : "Eliminar usuario"}
                            onClick={() => handleDelete(u)}
                          >
                            {deletingId === u.id ? "Eliminando..." : "Eliminar"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-ink-faint">
                      Todavía no hay usuarios creados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
