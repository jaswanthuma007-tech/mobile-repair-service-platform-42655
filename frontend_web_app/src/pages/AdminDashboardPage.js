import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Input, Modal, Select, Textarea } from '../components/ui';
import { useToast } from '../components/ToastProvider';
import {
  deleteRepairRequest,
  listRepairRequests,
  updateRepairRequest
} from '../services/repairRequestsService';
import { isSupabaseConfigured } from '../lib/supabaseClient';

const STATUSES = ['All', 'New', 'In Progress', 'Completed'];

function badgeTone(status) {
  if (status === 'New') return 'amber';
  if (status === 'In Progress') return 'blue';
  if (status === 'Completed') return 'green';
  return 'gray';
}

/**
 * PUBLIC_INTERFACE
 * Admin dashboard for managing repair requests.
 */
export default function AdminDashboardPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [items, setItems] = useState([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const filteredMeta = useMemo(() => {
    const counts = { New: 0, 'In Progress': 0, Completed: 0 };
    items.forEach((i) => {
      if (counts[i.status] !== undefined) counts[i.status] += 1;
    });
    return counts;
  }, [items]);

  async function refresh() {
    setLoading(true);
    try {
      const { data, error } = await listRepairRequests({ query, status });
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      toast.error('Load failed', err?.message || 'Unable to fetch repair requests.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => refresh(), 220);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status]);

  async function quickStatusChange(item, nextStatus) {
    try {
      const { data, error } = await updateRepairRequest(item.id, { status: nextStatus });
      if (error) throw error;
      setItems((prev) => prev.map((p) => (p.id === item.id ? data : p)));
      toast.success('Status updated', `${item.id} → ${nextStatus}`);
    } catch (err) {
      toast.error('Update failed', err?.message || 'Unable to update status.');
    }
  }

  function openEdit(item) {
    setEditItem({ ...item });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editItem) return;
    setEditSaving(true);
    try {
      const { data, error } = await updateRepairRequest(editItem.id, {
        deviceType: editItem.deviceType,
        issueDescription: editItem.issueDescription,
        preferredDate: editItem.preferredDate,
        preferredTime: editItem.preferredTime,
        contactName: editItem.contactName,
        contactEmail: editItem.contactEmail,
        contactPhone: editItem.contactPhone,
        status: editItem.status
      });
      if (error) throw error;
      setItems((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      toast.success('Saved', `${data.id} updated.`);
      setEditOpen(false);
      setEditItem(null);
    } catch (err) {
      toast.error('Save failed', err?.message || 'Unable to save changes.');
    } finally {
      setEditSaving(false);
    }
  }

  async function removeItem(item) {
    if (!window.confirm(`Delete ${item.id}? This cannot be undone.`)) return;
    try {
      const { error } = await deleteRepairRequest(item.id);
      if (error) throw error;
      setItems((prev) => prev.filter((p) => p.id !== item.id));
      toast.success('Deleted', `${item.id} removed.`);
    } catch (err) {
      toast.error('Delete failed', err?.message || 'Unable to delete request.');
    }
  }

  return (
    <div className="fade-in-up">
      <div className="spread" style={{ marginBottom: 12 }}>
        <div>
          <h1 className="h1" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
            Admin Dashboard
          </h1>
          <p className="p">
            Search, filter, and update repair requests. {!isSupabaseConfigured() ? 'Showing sample data.' : 'Live data.'}
          </p>
        </div>
        <div className="row">
          <Badge tone="amber">New: {filteredMeta.New}</Badge>
          <Badge tone="blue">In Progress: {filteredMeta['In Progress']}</Badge>
          <Badge tone="green">Completed: {filteredMeta.Completed}</Badge>
        </div>
      </div>

      <Card className="card-pad" style={{ marginBottom: 12 }}>
        <div className="grid-2">
          <Input
            label="Search"
            name="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID, device, issue, name, email, phone…"
          />
          <Select label="Status" name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        <div className="section row">
          <Button variant="ghost" onClick={refresh} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </Card>

      <Card className="card-pad">
        <div className="spread" style={{ marginBottom: 10 }}>
          <h2 className="h2" style={{ margin: 0 }}>
            Repair Requests
          </h2>
          <Badge tone="gray">{items.length} results</Badge>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" aria-label="Repair requests table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Device</th>
                <th>Issue</th>
                <th>Preferred</th>
                <th>Contact</th>
                <th>Status</th>
                <th style={{ width: 280 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td className="mono" style={{ fontWeight: 900 }}>
                    {r.id}
                  </td>
                  <td>{r.deviceType}</td>
                  <td style={{ maxWidth: 360 }}>{r.issueDescription}</td>
                  <td>
                    <div style={{ fontWeight: 800 }}>{r.preferredDate}</div>
                    <div className="help">{r.preferredTime}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 900 }}>{r.contactName}</div>
                    <div className="help">{r.contactEmail}</div>
                    <div className="help">{r.contactPhone}</div>
                  </td>
                  <td>
                    <Badge tone={badgeTone(r.status)}>{r.status}</Badge>
                  </td>
                  <td>
                    <div className="row">
                      <Button variant="ghost" onClick={() => openEdit(r)}>
                        Edit
                      </Button>
                      <Select
                        aria-label={`Change status for ${r.id}`}
                        value={r.status}
                        onChange={(e) => quickStatusChange(r, e.target.value)}
                      >
                        {STATUSES.filter((s) => s !== 'All').map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                      <Button variant="ghost" onClick={() => removeItem(r)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="section">
                      <p className="p">No requests found for this filter/search.</p>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={editOpen}
        title={editItem ? `Edit ${editItem.id}` : 'Edit'}
        onClose={() => {
          if (!editSaving) {
            setEditOpen(false);
            setEditItem(null);
          }
        }}
      >
        {editItem ? (
          <div className="fade-in-up">
            <div className="grid-2">
              <Input
                label="Device type"
                name="deviceType"
                value={editItem.deviceType}
                onChange={(e) => setEditItem((p) => ({ ...p, deviceType: e.target.value }))}
              />
              <Select
                label="Status"
                name="status"
                value={editItem.status}
                onChange={(e) => setEditItem((p) => ({ ...p, status: e.target.value }))}
              >
                {STATUSES.filter((s) => s !== 'All').map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <Textarea
              label="Issue description"
              name="issueDescription"
              value={editItem.issueDescription}
              onChange={(e) => setEditItem((p) => ({ ...p, issueDescription: e.target.value }))}
            />

            <div className="grid-2">
              <Input
                label="Preferred date"
                name="preferredDate"
                type="date"
                value={editItem.preferredDate}
                onChange={(e) => setEditItem((p) => ({ ...p, preferredDate: e.target.value }))}
              />
              <Input
                label="Preferred time"
                name="preferredTime"
                type="time"
                value={editItem.preferredTime}
                onChange={(e) => setEditItem((p) => ({ ...p, preferredTime: e.target.value }))}
              />
            </div>

            <div className="grid-2">
              <Input
                label="Contact name"
                name="contactName"
                value={editItem.contactName}
                onChange={(e) => setEditItem((p) => ({ ...p, contactName: e.target.value }))}
              />
              <Input
                label="Contact email"
                name="contactEmail"
                value={editItem.contactEmail}
                onChange={(e) => setEditItem((p) => ({ ...p, contactEmail: e.target.value }))}
              />
            </div>

            <Input
              label="Contact phone"
              name="contactPhone"
              value={editItem.contactPhone}
              onChange={(e) => setEditItem((p) => ({ ...p, contactPhone: e.target.value }))}
            />

            <div className="section row">
              <Button variant="primary" onClick={saveEdit} disabled={editSaving}>
                {editSaving ? 'Saving…' : 'Save changes'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setEditOpen(false);
                  setEditItem(null);
                }}
                disabled={editSaving}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
