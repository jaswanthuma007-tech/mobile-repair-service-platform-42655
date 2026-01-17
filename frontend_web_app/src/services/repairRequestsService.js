import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Repair request shape used throughout the UI.
 * This is intentionally simple so it can map cleanly to a Supabase table later.
 */

/** Minimal sample data when Supabase is not configured. */
const seed = [
  {
    id: 'REQ-1001',
    deviceType: 'iPhone',
    issueDescription: 'Screen cracked after drop. Touch works intermittently.',
    preferredDate: '2026-01-19',
    preferredTime: '14:00',
    contactName: 'Jordan Lee',
    contactEmail: 'jordan@example.com',
    contactPhone: '(555) 010-1010',
    consent: true,
    status: 'New',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
  },
  {
    id: 'REQ-1002',
    deviceType: 'Samsung Galaxy',
    issueDescription: 'Battery draining fast and overheating during charging.',
    preferredDate: '2026-01-20',
    preferredTime: '10:30',
    contactName: 'Avery Chen',
    contactEmail: 'avery@example.com',
    contactPhone: '(555) 010-2020',
    consent: true,
    status: 'In Progress',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString()
  },
  {
    id: 'REQ-1003',
    deviceType: 'Laptop',
    issueDescription: 'Keyboard keys stuck, occasional blue screen.',
    preferredDate: '2026-01-22',
    preferredTime: '16:00',
    contactName: 'Sam Patel',
    contactEmail: 'sam@example.com',
    contactPhone: '(555) 010-3030',
    consent: true,
    status: 'Completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 42).toISOString()
  }
];

let memoryStore = [...seed];

function generateId() {
  return `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
}

function normalizeQuery(q) {
  return String(q || '').trim().toLowerCase();
}

function matchesQuery(item, q) {
  const qq = normalizeQuery(q);
  if (!qq) return true;
  return (
    item.id.toLowerCase().includes(qq) ||
    item.deviceType.toLowerCase().includes(qq) ||
    item.issueDescription.toLowerCase().includes(qq) ||
    item.contactName.toLowerCase().includes(qq) ||
    item.contactEmail.toLowerCase().includes(qq) ||
    item.contactPhone.toLowerCase().includes(qq)
  );
}

function matchesStatus(item, status) {
  if (!status || status === 'All') return true;
  return item.status === status;
}

function mapRowToUi(row) {
  return {
    id: row.id,
    deviceType: row.device_type ?? row.deviceType ?? '',
    issueDescription: row.issue_description ?? row.issueDescription ?? '',
    preferredDate: row.preferred_date ?? row.preferredDate ?? '',
    preferredTime: row.preferred_time ?? row.preferredTime ?? '',
    contactName: row.contact_name ?? row.contactName ?? '',
    contactEmail: row.contact_email ?? row.contactEmail ?? '',
    contactPhone: row.contact_phone ?? row.contactPhone ?? '',
    consent: Boolean(row.consent ?? row.customer_consent ?? row.consent_to_contact ?? row.consentToContact ?? false),
    status: row.status ?? 'New',
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString()
  };
}

async function memoryList({ query, status, page, pageSize }) {
  const filtered = memoryStore
    .filter((r) => matchesStatus(r, status))
    .filter((r) => matchesQuery(r, query))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  return { data: filtered.slice(from, to), count: filtered.length, error: null };
}

async function memoryCreate(payload) {
  const item = {
    id: generateId(),
    status: 'New',
    createdAt: new Date().toISOString(),
    ...payload
  };
  memoryStore = [item, ...memoryStore];
  return { data: item, error: null };
}

async function memoryUpdate(id, updates) {
  let updated = null;
  memoryStore = memoryStore.map((r) => {
    if (r.id !== id) return r;
    updated = { ...r, ...updates };
    return updated;
  });
  if (!updated) return { data: null, error: new Error('Request not found') };
  return { data: updated, error: null };
}

async function memoryRemove(id) {
  const before = memoryStore.length;
  memoryStore = memoryStore.filter((r) => r.id !== id);
  if (memoryStore.length === before) return { data: null, error: new Error('Request not found') };
  return { data: { id }, error: null };
}

/**
 * PUBLIC_INTERFACE
 * Lists repair requests with optional search query and status filter.
 * Supports pagination via (page, pageSize).
 *
 * Return shape:
 * - data: array of requests (UI shape)
 * - count: total number of results for current filter (useful for pagination UI)
 */
export async function listRepairRequests({ query = '', status = 'All', page = 1, pageSize = 10 } = {}) {
  if (!isSupabaseConfigured()) return memoryList({ query, status, page, pageSize });

  // Expected table: repair_requests (id, device_type, issue_description, preferred_date, preferred_time, contact_*, status, created_at)
  // This query assumes RLS is configured appropriately for admin users.
  try {
    let q = supabase
      .from('repair_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status && status !== 'All') {
      q = q.eq('status', status);
    }

    // Conservative search implementation:
    // - Use "or" with ilike across common fields.
    // - If your schema differs, adjust these column names accordingly.
    const qq = normalizeQuery(query);
    if (qq) {
      const pattern = `%${qq}%`;
      q = q.or(
        [
          `id.ilike.${pattern}`,
          `device_type.ilike.${pattern}`,
          `issue_description.ilike.${pattern}`,
          `contact_name.ilike.${pattern}`,
          `contact_email.ilike.${pattern}`,
          `contact_phone.ilike.${pattern}`
        ].join(',')
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await q.range(from, to);

    if (error) return { data: null, count: null, error };

    return { data: (data || []).map(mapRowToUi), count: count ?? 0, error: null };
  } catch (e) {
    return { data: null, count: null, error: e };
  }
}

/**
 * PUBLIC_INTERFACE
 * Creates a new repair request (customer booking submission).
 */
export async function createRepairRequest(payload) {
  if (!isSupabaseConfigured()) return memoryCreate(payload);

  try {
    const row = {
      device_type: payload.deviceType,
      issue_description: payload.issueDescription,
      preferred_date: payload.preferredDate,
      preferred_time: payload.preferredTime,
      contact_name: payload.contactName,
      contact_email: payload.contactEmail,
      contact_phone: payload.contactPhone,
      consent: Boolean(payload.consent),
      status: payload.status ?? 'New'
    };

    const { data, error } = await supabase.from('repair_requests').insert(row).select('*').single();
    if (error) return { data: null, error };

    return { data: mapRowToUi(data), error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

/**
 * PUBLIC_INTERFACE
 * Updates an existing repair request (admin changes: status or details).
 */
export async function updateRepairRequest(id, updates) {
  if (!isSupabaseConfigured()) return memoryUpdate(id, updates);

  try {
    const patch = {};
    if (updates.deviceType !== undefined) patch.device_type = updates.deviceType;
    if (updates.issueDescription !== undefined) patch.issue_description = updates.issueDescription;
    if (updates.preferredDate !== undefined) patch.preferred_date = updates.preferredDate;
    if (updates.preferredTime !== undefined) patch.preferred_time = updates.preferredTime;
    if (updates.contactName !== undefined) patch.contact_name = updates.contactName;
    if (updates.contactEmail !== undefined) patch.contact_email = updates.contactEmail;
    if (updates.contactPhone !== undefined) patch.contact_phone = updates.contactPhone;
    if (updates.consent !== undefined) patch.consent = Boolean(updates.consent);
    if (updates.status !== undefined) patch.status = updates.status;

    const { data, error } = await supabase.from('repair_requests').update(patch).eq('id', id).select('*').single();
    if (error) return { data: null, error };

    return { data: mapRowToUi(data), error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

/**
 * PUBLIC_INTERFACE
 * Deletes an existing repair request.
 */
export async function deleteRepairRequest(id) {
  if (!isSupabaseConfigured()) return memoryRemove(id);

  try {
    const { error } = await supabase.from('repair_requests').delete().eq('id', id);
    if (error) return { data: null, error };
    return { data: { id }, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}
