import { useState, useEffect } from 'react';

const SCRIPT_URL = process.env.REACT_APP_SCRIPT_URL;
const AI_URL = '/.netlify/functions/ai';

const HEADERS = [
  'Fecha actual',
  'Fecha del mensaje',
  'Nro Incidente',
  'Servicio',
  'De qué se trata',
  'Qué hice',
  'Notas',
];

const TEXTAREA_FIELDS = ['De qué se trata', 'Qué hice', 'Notas'];

const SERVICIOS = [
  'Alumbrado Público',
  'Ambiente y Desarrollo Sostenible',
  'Arbolado',
  'Calles y veredas',
  'Catastro',
  'Cementerio',
  'Centros de Atención Municipal',
  'ChatBot',
  'Ciudad Universitaria',
  'Comercio',
  'Control de Gestión',
  'Espacios Verdes',
  'Estacionamiento Digital',
  'Estacionamiento Medido',
  'Higiene Urbana',
  'Licencias de Conducir',
  'Obras Privadas',
  'Obras Públicas',
  'Recorrido',
  'Rentas',
  'Salud',
  'Salud Animal',
  'Saneamiento Ambiental',
  'Seguridad ciudadana',
  'Tránsito',
];

const today = () => new Date().toISOString().split('T')[0];

const emptyForm = () => ({
  'Fecha actual': today(),
  'Fecha del mensaje': '',
  'Nro Incidente': '',
  'Servicio': '',
  'De qué se trata': '',
  'Qué hice': '',
  'Notas': '',
});

export default function App() {
  const [records, setRecords]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(null); // { mode, form, _row? }
  const [saving, setSaving]       = useState(false);
  const [aiQ, setAiQ]             = useState('');
  const [aiA, setAiA]             = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  /* ── Fetch ── */
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(SCRIPT_URL);
      const json = await res.json();
      setRecords(json.data || []);
    } catch (e) {
      setError('No se pudo conectar con la hoja. Revisá la URL del script.');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  /* ── Save (add / update) ── */
  const save = async () => {
    setSaving(true);
    const { mode, form, _row } = modal;
    const payload = mode === 'add'
      ? { action: 'add', data: form }
      : { action: 'update', _row, data: form };
    try {
      await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
      setModal(null);
      await fetchData();
    } catch {
      alert('Error al guardar. Intentá de nuevo.');
    }
    setSaving(false);
  };

  /* ── Delete ── */
  const del = async (row) => {
    if (!window.confirm(`¿Eliminar el incidente #${row['Nro Incidente']}?`)) return;
    await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', _row: row._row }),
    });
    fetchData();
  };

  /* ── Export CSV ── */
  const exportCSV = () => {
    const rows = [HEADERS, ...filtered.map(r => HEADERS.map(h => r[h] ?? ''))];
    const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a    = document.createElement('a');
    a.href     = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
    a.download = `incidentes_${today()}.csv`;
    a.click();
  };

  /* ── AI ── */
  const askAI = async () => {
    if (!aiQ.trim()) return;
    setAiLoading(true);
    setAiA('');
    try {
      const res  = await fetch(AI_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ question: aiQ, data: records }),
      });
      const json = await res.json();
      setAiA(json.answer || 'Sin respuesta.');
    } catch {
      setAiA('Error al consultar la IA.');
    }
    setAiLoading(false);
  };

  /* ── Filter ── */
  const filtered = records.filter(r =>
    HEADERS.some(h =>
      String(r[h] ?? '').toLowerCase().includes(search.toLowerCase())
    )
  );

  /* ── Styles (inline, sin deps externas) ── */
  const s = {
    btn:    (bg) => ({ padding: '8px 16px', background: bg, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }),
    input:  { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' },
    label:  { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 },
    cell:   { padding: '7px 10px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 },
    th:     { padding: '9px 10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', background: '#f3f4f6' },
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 1280, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>📋 Gestión de Incidentes</h1>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>Control de Gestión — Municipio de Mendoza</p>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Buscar en todos los campos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...s.input, flex: 1, minWidth: 200 }}
        />
        <button onClick={() => setModal({ mode: 'add', form: emptyForm() })} style={s.btn('#2563eb')}>+ Nuevo</button>
        <button onClick={exportCSV}    style={s.btn('#16a34a')}>↓ CSV</button>
        <button onClick={fetchData}    style={s.btn('#6b7280')}>↺ Actualizar</button>
      </div>

      {/* Error */}
      {error && <p style={{ color: '#dc2626', background: '#fef2f2', padding: 12, borderRadius: 6, marginBottom: 16 }}>{error}</p>}

      {/* Table */}
      {loading ? (
        <p style={{ color: '#6b7280', padding: 24 }}>Cargando datos...</p>
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: 32, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {HEADERS.map(h => <th key={h} style={s.th}>{h}</th>)}
                <th style={{ ...s.th, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={HEADERS.length + 1} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
                    Sin resultados
                  </td>
                </tr>
              ) : filtered.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  {HEADERS.map(h => (
                    <td key={h} style={s.cell} title={String(row[h] ?? '')}>
                      {String(row[h] ?? '')}
                    </td>
                  ))}
                  <td style={{ padding: '6px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => setModal({ mode: 'edit', form: { ...row }, _row: row._row })}
                      style={{ ...s.btn('#f59e0b'), padding: '4px 10px', marginRight: 6, fontSize: 12 }}>
                      Editar
                    </button>
                    <button
                      onClick={() => del(row)}
                      style={{ ...s.btn('#ef4444'), padding: '4px 10px', fontSize: 12 }}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ color: '#9ca3af', fontSize: 12, padding: '6px 10px' }}>{filtered.length} de {records.length} registros</p>
        </div>
      )}

      {/* AI Chat */}
      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>🤖 Consultar IA sobre los datos</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={aiQ}
            onChange={e => setAiQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askAI()}
            placeholder="Ej: ¿Cuántos incidentes tiene el servicio X? ¿Qué notas mencionan...?"
            style={{ ...s.input, flex: 1, border: '1px solid #7dd3fc' }}
          />
          <button onClick={askAI} disabled={aiLoading} style={s.btn('#0284c7')}>
            {aiLoading ? '...' : 'Consultar'}
          </button>
        </div>
        {aiA && (
          <div style={{ marginTop: 12, padding: 14, background: '#fff', borderRadius: 6, border: '1px solid #e0f2fe', fontSize: 13, lineHeight: 1.7 }}>
            {aiA}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 24, width: '92%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>
              {modal.mode === 'add' ? '➕ Nuevo registro' : '✏️ Editar registro'}
            </h2>

            {HEADERS.map(h => (
              <div key={h} style={{ marginBottom: 14 }}>
                <label style={s.label}>{h}</label>
                {h === 'Servicio' ? (
                  <select
                    value={modal.form[h] || ''}
                    onChange={e => setModal(m => ({ ...m, form: { ...m.form, [h]: e.target.value } }))}
                    style={{ ...s.input }}>
                    <option value=''>— Seleccioná un servicio —</option>
                    {SERVICIOS.map(sv => <option key={sv} value={sv}>{sv}</option>)}
                  </select>
                ) : TEXTAREA_FIELDS.includes(h) ? (
                  <textarea
                    rows={3}
                    value={modal.form[h] || ''}
                    onChange={e => setModal(m => ({ ...m, form: { ...m.form, [h]: e.target.value } }))}
                    style={{ ...s.input, resize: 'vertical' }}
                  />
                ) : (
                  <input
                    type={h.includes('Fecha') ? 'date' : 'text'}
                    value={modal.form[h] || ''}
                    readOnly={h === 'Fecha actual'}
                    onChange={e => setModal(m => ({ ...m, form: { ...m.form, [h]: e.target.value } }))}
                    style={{ ...s.input, background: h === 'Fecha actual' ? '#f3f4f6' : '#fff', cursor: h === 'Fecha actual' ? 'not-allowed' : 'text' }}
                  />
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setModal(null)}  style={{ ...s.btn('#e5e7eb'), color: '#374151' }}>Cancelar</button>
              <button onClick={save} disabled={saving} style={s.btn('#2563eb')}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
