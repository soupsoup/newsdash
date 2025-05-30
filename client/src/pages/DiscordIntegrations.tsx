import React, { useState } from "react";

export interface DiscordIntegration {
  id: number;
  name: string;
  purpose: "source" | "destination" | "both";
  webhookUrl?: string;
  channelId: string;
  apiKey?: string;
  status: "connected" | "error" | "disconnected";
  lastSyncAt?: string;
}

function useDiscordIntegrations() {
  const [integrations, setIntegrations] = useState<DiscordIntegration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIntegrations = async () => {
    setLoading(true);
    const res = await fetch("/api/discord-integrations");
    const data = await res.json();
    setIntegrations(data);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchIntegrations();
  }, []);

  const addIntegration = async (integration: Omit<DiscordIntegration, "id" | "status" | "lastSyncAt">) => {
    const res = await fetch("/api/discord-integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(integration),
    });
    await fetchIntegrations();
    return res.ok;
  };

  const updateIntegration = async (id: number, integration: Partial<DiscordIntegration>) => {
    const res = await fetch(`/api/discord-integrations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(integration),
    });
    await fetchIntegrations();
    return res.ok;
  };

  const deleteIntegration = async (id: number) => {
    const res = await fetch(`/api/discord-integrations/${id}`, { method: "DELETE" });
    await fetchIntegrations();
    return res.ok;
  };

  return { integrations, loading, addIntegration, updateIntegration, deleteIntegration, fetchIntegrations };
}

const emptyForm = {
  name: "",
  purpose: "source" as "source" | "destination" | "both",
  webhookUrl: "",
  channelId: "",
  apiKey: "",
};

const DiscordIntegrationsPage = () => {
  const { integrations, loading, addIntegration, updateIntegration, deleteIntegration } = useDiscordIntegrations();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => {
    setForm({ ...emptyForm });
    setEditId(null);
    setShowModal(true);
    setError(null);
  };

  const openEdit = (integration: DiscordIntegration) => {
    setForm({
      name: integration.name,
      purpose: integration.purpose,
      webhookUrl: integration.webhookUrl || "",
      channelId: integration.channelId,
      apiKey: integration.apiKey || "",
    });
    setEditId(integration.id);
    setShowModal(true);
    setError(null);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this integration?")) {
      await deleteIntegration(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.purpose || !form.channelId) {
      setError("Name, Purpose, and Channel ID are required.");
      return;
    }
    if (editId) {
      await updateIntegration(editId, form);
    } else {
      await addIntegration(form);
    }
    setShowModal(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Discord Integrations</h1>
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={openAdd}
      >
        Add Discord Integration
      </button>
      {loading ? (
        <div>Loading...</div>
      ) : integrations.length === 0 ? (
        <div>No Discord integrations found.</div>
      ) : (
        <table className="w-full border mt-2">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Purpose</th>
              <th className="p-2 border">Channel ID</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Last Sync</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {integrations.map((integration) => (
              <tr key={integration.id}>
                <td className="p-2 border">{integration.name}</td>
                <td className="p-2 border">{integration.purpose}</td>
                <td className="p-2 border">{integration.channelId}</td>
                <td className="p-2 border">{integration.status}</td>
                <td className="p-2 border">{integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString() : "-"}</td>
                <td className="p-2 border">
                  <button
                    className="px-2 py-1 bg-yellow-500 text-white rounded mr-2 hover:bg-yellow-600"
                    onClick={() => openEdit(integration)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    onClick={() => handleDelete(integration.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editId ? "Edit" : "Add"} Discord Integration</h2>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block mb-1 font-medium">Name</label>
                <input
                  className="w-full border p-2 rounded"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Purpose</label>
                <select
                  className="w-full border p-2 rounded"
                  value={form.purpose}
                  onChange={e => setForm({ ...form, purpose: e.target.value as any })}
                  required
                >
                  <option value="source">Source</option>
                  <option value="destination">Destination</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Webhook URL</label>
                <input
                  className="w-full border p-2 rounded"
                  value={form.webhookUrl}
                  onChange={e => setForm({ ...form, webhookUrl: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Channel ID</label>
                <input
                  className="w-full border p-2 rounded"
                  value={form.channelId}
                  onChange={e => setForm({ ...form, channelId: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">API Key (optional)</label>
                <input
                  className="w-full border p-2 rounded"
                  value={form.apiKey}
                  onChange={e => setForm({ ...form, apiKey: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editId ? "Save Changes" : "Add Integration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscordIntegrationsPage; 