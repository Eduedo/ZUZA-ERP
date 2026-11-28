import {
  SEED_USUARIOS,
  SEED_RAZONES_SOCIALES,
  SEED_CONTACTOS,
  SEED_PRODUCTOS,
  SEED_COMANDAS
} from './seed-data.js';

// ============================================================================
// ESTADO GLOBAL Y CONFIGURACIÓN
// ============================================================================
const STORAGE_KEYS = {
  USUARIOS: 'zuza_usuarios',
  RAZONES: 'zuza_razones_sociales',
  CONTACTOS: 'zuza_contactos',
  PRODUCTOS: 'zuza_productos',
  COMANDAS: 'zuza_comandas',
  RESERVAS: 'zuza_reservas_oc',
  CURRENT_USER: 'zuza_current_user',
  SB_URL: 'zuza_sb_url',
  SB_KEY: 'zuza_sb_key'
};

function getSessionId() {
  let sid = sessionStorage.getItem('zuza_session_id');
  if (!sid) {
    sid = (crypto.randomUUID ? crypto.randomUUID() : 'sess_' + Math.random().toString(36).slice(2) + Date.now());
    sessionStorage.setItem('zuza_session_id', sid);
  }
  return sid;
}

let state = {
  usuarios: [],
  razonesSociales: [],
  contactos: [],
  productos: [],
  comandas: [],
  supabase: null,
  isOnline: false,
  sessionId: getSessionId(),
  currentUser: null,
  reservedOC: null,       // { numero_correlativo, oc }
  editingComandaId: null  // null = creando nueva, number = editando existente
};

// ============================================================================
// UTILIDADES DE NEGOCIO (Misma lógica de tu planilla)
// ============================================================================
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function formatTextoFecha(dateStr) {
  if (!dateStr) return 'sábado 00 de enero';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DIAS[dt.getDay()]} ${String(d).padStart(2, '0')} de ${MESES[m - 1]}`;
}

function roundToHundred(val) {
  return Math.round((Number(val) || 0) / 100) * 100;
}

function calcNetoUnit(pxq) {
  return (Number(pxq) || 0) / 1.19;
}

function formatCLP(num) {
  return '$' + Math.round(Number(num) || 0).toLocaleString('es-CL');
}

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function tomorrowISO() {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function showToast(msg, isError = false) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${isError ? 'bg-rose-600' : 'bg-slate-900'}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3200);
}

// ============================================================================
// INICIALIZACIÓN Y PERSISTENCIA (LOCAL + SUPABASE)
// ============================================================================
async function init() {
  const sbUrl = localStorage.getItem(STORAGE_KEYS.SB_URL);
  const sbKey = localStorage.getItem(STORAGE_KEYS.SB_KEY);

  if (sbUrl && sbKey && window.supabase) {
    try {
      state.supabase = window.supabase.createClient(sbUrl, sbKey);
      document.getElementById('cfg-sb-url').value = sbUrl;
      document.getElementById('cfg-sb-key').value = sbKey;
      await loadFromSupabase();
      setConnectionBadge(true);
    } catch (err) {
      console.error('Error conectando a Supabase, usando modo local:', err);
      loadFromLocal();
      setConnectionBadge(false);
      showToast('No se pudo conectar a Supabase. Usando Modo Local.', true);
    }
  } else {
    loadFromLocal();
    setConnectionBadge(false);
  }

  // Cargar usuario activo o pedir Login
  const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      const exists = state.usuarios.find(u => u.nombre === parsed.nombre && u.activo !== false);
      if (exists) state.currentUser = exists;
    } catch (_) {}
  }

  updateUserBadge();
  populateSelects();
  await resetComandaForm();
  renderAgenda();
  renderHistorial();
  renderCatalogo();

  if (!state.currentUser) {
    openLoginModal();
  }
}

function setConnectionBadge(online) {
  state.isOnline = online;
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  if (online) {
    dot.className = 'w-2 h-2 rounded-full bg-emerald-500';
    text.textContent = 'Supabase Online';
  } else {
    dot.className = 'w-2 h-2 rounded-full bg-amber-500';
    text.textContent = 'Modo Local';
  }
}

function loadFromLocal() {
  if (!localStorage.getItem(STORAGE_KEYS.USUARIOS)) {
    localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(SEED_USUARIOS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RAZONES)) {
    localStorage.setItem(STORAGE_KEYS.RAZONES, JSON.stringify(SEED_RAZONES_SOCIALES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONTACTOS)) {
    localStorage.setItem(STORAGE_KEYS.CONTACTOS, JSON.stringify(SEED_CONTACTOS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTOS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(SEED_PRODUCTOS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMANDAS)) {
    localStorage.setItem(STORAGE_KEYS.COMANDAS, JSON.stringify(SEED_COMANDAS));
  }

  state.usuarios = JSON.parse(localStorage.getItem(STORAGE_KEYS.USUARIOS));
  state.razonesSociales = JSON.parse(localStorage.getItem(STORAGE_KEYS.RAZONES));
  state.contactos = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTACTOS));
  state.productos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTOS)).map(p => ({ ...p, activo: p.activo !== false }));
  state.comandas = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMANDAS));
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(state.usuarios));
  localStorage.setItem(STORAGE_KEYS.RAZONES, JSON.stringify(state.razonesSociales));
  localStorage.setItem(STORAGE_KEYS.CONTACTOS, JSON.stringify(state.contactos));
  localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(state.productos));
  localStorage.setItem(STORAGE_KEYS.COMANDAS, JSON.stringify(state.comandas));
}

async function loadFromSupabase() {
  const sb = state.supabase;
  const [usrRes, rsRes, contRes, prodRes, cmdRes] = await Promise.all([
    sb.from('usuarios').select('*').order('nombre'),
    sb.from('razones_sociales').select('*').order('id'),
    sb.from('contactos').select('*').order('nombre'),
    sb.from('productos').select('*').order('nombre'),
    sb.from('comandas').select('*, comanda_items(*)').order('numero_correlativo', { ascending: false })
  ]);

  if (rsRes.error) throw rsRes.error;
  if (contRes.error) throw contRes.error;
  if (prodRes.error) throw prodRes.error;
  if (cmdRes.error) throw cmdRes.error;

  state.usuarios = (!usrRes.error && usrRes.data?.length) ? usrRes.data : SEED_USUARIOS;
  state.razonesSociales = rsRes.data.length ? rsRes.data : SEED_RAZONES_SOCIALES;
  state.contactos = contRes.data.length ? contRes.data : SEED_CONTACTOS;
  state.productos = (prodRes.data.length ? prodRes.data : SEED_PRODUCTOS).map(p => ({ ...p, activo: p.activo !== false }));
  state.comandas = cmdRes.data.map(c => ({
    ...c,
    items: (c.comanda_items || []).sort((a, b) => a.linea - b.linea)
  }));
}

// ============================================================================
// LOGIN Y SESIONES
// ============================================================================
function updateUserBadge() {
  const badge = document.getElementById('user-badge-text');
  badge.textContent = state.currentUser ? `${state.currentUser.nombre} (${state.currentUser.rol})` : 'Iniciar Sesión';
}

window.openLoginModal = function() {
  const sel = document.getElementById('login-usuario');
  const activos = state.usuarios.filter(u => u.activo !== false);
  sel.innerHTML = activos.map(u => `<option value="${u.nombre}">${u.nombre} (${u.rol})</option>`).join('');
  if (state.currentUser) sel.value = state.currentUser.nombre;
  document.getElementById('login-pin').value = '';
  document.getElementById('modal-login').classList.remove('hidden');
};

window.doLogin = async function() {
  const nombre = document.getElementById('login-usuario').value;
  const pin = document.getElementById('login-pin').value.trim();
  const user = state.usuarios.find(u => u.nombre === nombre);

  if (!user) return showToast('Selecciona un usuario válido.', true);
  if (String(user.pin) !== String(pin)) {
    return showToast('PIN incorrecto (por defecto es 1234).', true);
  }

  state.currentUser = user;
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  document.getElementById('modal-login').classList.add('hidden');
  updateUserBadge();
  await reserveNextOC(false);
  showToast(`Sesión iniciada como ${user.nombre}`);
};

// ============================================================================
// RESERVA ATÓMICA DE Nº DE PEDIDO (OC) PARA SESIONES SIMULTÁNEAS
// ============================================================================
window.reserveNextOC = async function(forceNew = false) {
  if (state.editingComandaId) return; // No reservar si está editando un pedido existente

  const usuarioNombre = state.currentUser?.nombre || 'Invitado';

  if (state.isOnline && state.supabase) {
    try {
      if (forceNew) {
        await state.supabase.rpc('liberar_reserva_oc', { p_session_id: state.sessionId });
      }
      const { data, error } = await state.supabase.rpc('reservar_siguiente_oc', {
        p_session_id: state.sessionId,
        p_usuario: usuarioNombre
      });
      if (!error && data && data.length > 0) {
        state.reservedOC = data[0];
        applyReservedOCUI();
        return;
      }
    } catch (err) {
      console.warn('RPC reservar_siguiente_oc no disponible, usando cálculo local:', err);
    }
  }

  // Fallback Local (también soporta múltiples pestañas en el mismo navegador)
  const now = Date.now();
  let reservas = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVAS) || '[]').filter(r => r.expiresAt > now);
  if (forceNew) {
    reservas = reservas.filter(r => r.sessionId !== state.sessionId);
  }
  let mine = reservas.find(r => r.sessionId === state.sessionId);
  if (!mine) {
    const maxCmd = state.comandas.reduce((m, c) => Math.max(m, Number(c.numero_correlativo) || 0), 290);
    const maxRes = reservas.reduce((m, r) => Math.max(m, Number(r.numero_correlativo) || 0), 290);
    const nextNum = Math.max(maxCmd, maxRes, 290) + 1;
    mine = { numero_correlativo: nextNum, oc: `ZRA-${nextNum}`, sessionId: state.sessionId, usuario: usuarioNombre, expiresAt: now + 30 * 60000 };
    reservas.push(mine);
  } else {
    mine.expiresAt = now + 30 * 60000;
  }
  localStorage.setItem(STORAGE_KEYS.RESERVAS, JSON.stringify(reservas));
  state.reservedOC = mine;
  applyReservedOCUI();
};

function applyReservedOCUI() {
  if (!state.reservedOC) return;
  const oc = state.reservedOC.oc;
  document.getElementById('cmd-oc').value = oc;
  document.getElementById('next-oc-badge').textContent = `OC Reservada: ${oc}`;
  const statusEl = document.getElementById('oc-reserva-status');
  statusEl.textContent = `Reservado para ${state.currentUser?.nombre || 'tu sesión'}`;
  statusEl.classList.remove('hidden');
  updateDescriptorPreview();
}

async function releaseReservation() {
  if (state.isOnline && state.supabase) {
    try {
      await state.supabase.rpc('liberar_reserva_oc', { p_session_id: state.sessionId });
    } catch (_) {}
  }
  let reservas = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVAS) || '[]');
  reservas = reservas.filter(r => r.sessionId !== state.sessionId);
  localStorage.setItem(STORAGE_KEYS.RESERVAS, JSON.stringify(reservas));
}

// ============================================================================
// NAVEGACIÓN Y POBLADO DE LISTAS
// ============================================================================
window.switchTab = function(tabId) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
  document.querySelector(`.tab-btn[data-tab="${tabId}"]`)?.classList.add('active');

  if (tabId === 'agenda') renderAgenda();
  if (tabId === 'historial') renderHistorial();
  if (tabId === 'catalogo') renderCatalogo();
};

function populateSelects() {
  const rsSelect = document.getElementById('cmd-razon-social');
  const contRsSelect = document.getElementById('new-cont-rs');
  rsSelect.innerHTML = '<option value="">-- Particular / Sin Razón Social --</option>';
  contRsSelect.innerHTML = '<option value="">Particular</option>';

  state.razonesSociales.forEach(rs => {
    rsSelect.innerHTML += `<option value="${rs.id}">${rs.razon_social}</option>`;
    contRsSelect.innerHTML += `<option value="${rs.id}">${rs.razon_social}</option>`;
  });

  const dlContactos = document.getElementById('lista-contactos');
  dlContactos.innerHTML = state.contactos.map(c => `<option value="${c.nombre}">`).join('');

  // Solo productos VISIBLES (activo !== false) aparecen al armar un pedido
  const dlProductos = document.getElementById('lista-productos');
  dlProductos.innerHTML = state.productos
    .filter(p => p.activo !== false)
    .map(p => `<option value="${p.nombre}">`)
    .join('');
}

// ============================================================================
// FORMULARIO NUEVA COMANDA (Y EDICIÓN DE PEDIDOS)
// ============================================================================
window.resetComandaForm = async function() {
  state.editingComandaId = null;
  document.getElementById('edit-mode-banner').classList.add('hidden');
  document.getElementById('btn-save-comanda').textContent = 'Guardar y Agendar Comanda';

  document.getElementById('cmd-fecha-pedido').value = todayISO();
  document.getElementById('cmd-fecha-entrega').value = tomorrowISO();
  document.getElementById('cmd-fecha-elaboracion').value = tomorrowISO();
  document.getElementById('cmd-fecha-envasado').value = tomorrowISO();
  document.getElementById('cmd-eta-hora').value = '12:00';
  document.getElementById('cmd-tipo-doc').value = 'Factura';
  document.getElementById('cmd-cliente').value = '';
  document.getElementById('cmd-razon-social').value = '';
  document.getElementById('cmd-tipo-servicio').value = 'Servicio';
  document.getElementById('cmd-tip-serv').value = '';
  document.getElementById('cmd-obs').value = '';

  document.getElementById('cmd-items-body').innerHTML = '';
  addItemRow();
  await reserveNextOC(false);
  onFechaHoraEntregaChange();
  recalcTotals();
};

window.cancelEditComanda = async function() {
  await resetComandaForm();
  showToast('Edición cancelada.');
};

window.editComanda = function(id) {
  const c = state.comandas.find(x => x.id === id);
  if (!c) return;

  state.editingComandaId = id;
  document.getElementById('edit-mode-banner').classList.remove('hidden');
  document.getElementById('edit-oc-label').textContent = c.oc;
  document.getElementById('oc-reserva-status').classList.add('hidden');
  document.getElementById('btn-save-comanda').textContent = `Actualizar Pedido ${c.oc}`;

  document.getElementById('cmd-oc').value = c.oc;
  document.getElementById('cmd-fecha-pedido').value = c.fecha_pedido || todayISO();
  document.getElementById('cmd-fecha-entrega').value = c.fecha_entrega || tomorrowISO();
  document.getElementById('cmd-fecha-elaboracion').value = c.fecha_elaboracion || c.fecha_entrega || tomorrowISO();
  document.getElementById('cmd-fecha-envasado').value = c.fecha_envasado || c.fecha_entrega || tomorrowISO();
  const etaMatch = (c.hrs_entrega || '').match(/(\d{1,2}:\d{2})/);
  document.getElementById('cmd-eta-hora').value = etaMatch ? etaMatch[1].padStart(5, '0') : '12:00';
  document.getElementById('cmd-tipo-doc').value = c.tipo_documento || 'Factura';
  document.getElementById('cmd-cliente').value = c.cliente_nombre || '';
  document.getElementById('cmd-razon-social').value = c.razon_social_id || '';
  document.getElementById('cmd-tipo-servicio').value = c.tipo_servicio || 'Servicio';
  document.getElementById('cmd-tip-serv').value = c.tip_serv || '';
  document.getElementById('cmd-obs').value = c.obs || '';
  document.getElementById('urgencia-auto-badge').textContent = '';

  const body = document.getElementById('cmd-items-body');
  body.innerHTML = '';
  (c.items || []).forEach(it => {
    addItemRow({
      txt: it.txt,
      ume: it.ume,
      pxq: it.pxq,
      qty: (it.ume === 'kg' || it.ume === 'g') && it.peso ? it.peso : it.qty,
      bulto: it.bulto || ''
    });
  });

  updateDescriptorPreview();
  recalcTotals();
  switchTab('nueva-comanda');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.onFechaHoraEntregaChange = function() {
  const fechaEnt = document.getElementById('cmd-fecha-entrega').value;
  const hora = document.getElementById('cmd-eta-hora').value || '12:00';
  const badge = document.getElementById('urgencia-auto-badge');

  if (fechaEnt) {
    // Si elaboración/envasado no fueron editados manualmente en un pedido nuevo, acompañan la fecha de entrega
    if (!state.editingComandaId) {
      document.getElementById('cmd-fecha-elaboracion').value = fechaEnt;
      document.getElementById('cmd-fecha-envasado').value = fechaEnt;
    }

    const target = new Date(`${fechaEnt}T${hora}:00`);
    const diffHrs = (target.getTime() - Date.now()) / 3600000;

    if (diffHrs <= 4) {
      document.getElementById('cmd-tipo-servicio').value = 'Servicio urgente';
      document.getElementById('cmd-tip-serv').value = '>3hrs';
      badge.textContent = diffHrs > 0 ? `Faltan ${diffHrs.toFixed(1)} hrs → Urgente (>3hrs)` : 'Entrega inmediata → Urgente';
      badge.className = 'text-[10px] font-bold text-rose-600 mt-1';
    } else if (diffHrs <= 8) {
      document.getElementById('cmd-tipo-servicio').value = 'Servicio urgente';
      document.getElementById('cmd-tip-serv').value = '>7hrs';
      badge.textContent = `Faltan ${diffHrs.toFixed(1)} hrs → Urgente (>7hrs)`;
      badge.className = 'text-[10px] font-bold text-rose-600 mt-1';
    } else if (diffHrs <= 24) {
      document.getElementById('cmd-tipo-servicio').value = 'Servicio';
      document.getElementById('cmd-tip-serv').value = '> 11hrs';
      badge.textContent = `Faltan ${Math.round(diffHrs)} hrs (> 11hrs)`;
      badge.className = 'text-[10px] font-semibold text-amber-700 mt-1';
    } else if (diffHrs >= 72) {
      document.getElementById('cmd-tipo-servicio').value = 'Servicio';
      document.getElementById('cmd-tip-serv').value = '>72hrs';
      badge.textContent = `Faltan ${Math.round(diffHrs)} hrs (>72hrs)`;
      badge.className = 'text-[10px] font-semibold text-emerald-700 mt-1';
    } else {
      document.getElementById('cmd-tipo-servicio').value = 'Servicio';
      document.getElementById('cmd-tip-serv').value = '';
      badge.textContent = `Faltan ${Math.round(diffHrs)} hrs (Normal)`;
      badge.className = 'text-[10px] font-semibold text-slate-500 mt-1';
    }
  } else {
    badge.textContent = '';
  }

  updateDescriptorPreview();
};

window.onClienteChange = function() {
  const nombre = document.getElementById('cmd-cliente').value.trim().toLowerCase();
  const match = state.contactos.find(c => c.nombre.toLowerCase() === nombre);
  if (match) {
    if (match.razon_social_id) {
      document.getElementById('cmd-razon-social').value = match.razon_social_id;
    }
    if (match.destino_habitual && !document.getElementById('cmd-obs').value) {
      document.getElementById('cmd-obs').value = match.destino_habitual;
    }
  }
  updateDescriptorPreview();
};

window.updateDescriptorPreview = function() {
  const tipoServ = document.getElementById('cmd-tipo-servicio').value || 'Servicio';
  const fechaEnt = document.getElementById('cmd-fecha-entrega').value;
  const oc = document.getElementById('cmd-oc').value.trim();
  const obs = document.getElementById('cmd-obs').value.trim();
  const hora = document.getElementById('cmd-eta-hora').value;
  const eta = hora ? `ETA ${hora} HRS` : '';
  const textoFecha = formatTextoFecha(fechaEnt);

  const descriptor = `${tipoServ} ${textoFecha} ${oc} ${obs} ${eta}`.replace(/\s+/g, ' ').trim();
  document.getElementById('cmd-descriptor-preview').textContent = descriptor;

  const cliente = document.getElementById('cmd-cliente').value.trim();
  const tipoDoc = document.getElementById('cmd-tipo-doc').value;
  document.getElementById('sum-oc-badge').textContent = oc || 'ZRA-';
  document.getElementById('sum-cliente').textContent = cliente || 'Sin definir';
  document.getElementById('sum-entrega').textContent = fechaEnt ? `${textoFecha}${hora ? ' • ' + hora + ' hrs' : ''}` : 'Sin fecha';
  document.getElementById('sum-obs').textContent = obs || 'Sin especificar';
  document.getElementById('sum-doc').textContent = tipoDoc;
};

window.quickAddItem = function(txt, pxq, ume) {
  const rows = document.querySelectorAll('#cmd-items-body .item-row');
  if (rows.length === 1 && !rows[0].querySelector('.item-txt').value.trim()) {
    rows[0].querySelector('.item-txt').value = txt;
    rows[0].querySelector('.item-pxq').value = pxq;
    rows[0].querySelector('.item-ume').value = ume;
    rows[0].querySelector('.item-qty').focus();
    recalcTotals();
    return;
  }
  addItemRow({ txt, pxq, ume, qty: 1 });
};

window.addItemRow = function(prefill = {}, autoFocus = false) {
  const container = document.getElementById('cmd-items-body');
  const card = document.createElement('div');
  card.className = 'item-row rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5';
  card.innerHTML = `
    <div class="flex items-start gap-2">
      <div class="flex-1">
        <label class="block text-[11px] font-semibold text-slate-500 mb-1">Producto / Servicio</label>
        <input type="text" list="lista-productos" placeholder="Busca o escribe el producto..." class="input-field !py-2 text-sm font-medium item-txt" value="${prefill.txt || ''}" />
      </div>
      <button type="button" title="Eliminar ítem" class="mt-6 w-9 h-9 rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 font-bold text-lg flex items-center justify-center shrink-0 btn-del-row">&times;</button>
    </div>

    <div class="grid grid-cols-3 gap-2.5">
      <div>
        <label class="block text-[11px] font-semibold text-slate-500 mb-1">Cant / Peso</label>
        <input type="number" inputmode="decimal" step="any" min="0" class="input-field !py-2 text-sm font-semibold item-qty" value="${prefill.qty ?? 1}" />
      </div>
      <div>
        <label class="block text-[11px] font-semibold text-slate-500 mb-1">UME</label>
        <select class="input-field !py-2 text-sm item-ume">
          <option value="un" ${(prefill.ume || 'un') === 'un' ? 'selected' : ''}>un</option>
          <option value="punit" ${prefill.ume === 'punit' ? 'selected' : ''}>punit</option>
          <option value="kg" ${prefill.ume === 'kg' ? 'selected' : ''}>kg</option>
          <option value="g" ${prefill.ume === 'g' ? 'selected' : ''}>g</option>
        </select>
      </div>
      <div>
        <label class="block text-[11px] font-semibold text-slate-500 mb-1">Precio c/IVA</label>
        <input type="number" inputmode="decimal" step="any" min="0" class="input-field !py-2 text-sm font-semibold item-pxq" value="${prefill.pxq ?? 0}" />
      </div>
    </div>

    <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-xs">
      <div class="flex items-center gap-2">
        <span class="text-slate-500">Neto: <strong class="font-mono text-slate-700 item-neto">$0</strong></span>
        <input type="text" placeholder="Bulto (ej: 1 de 2)" class="input-field !w-28 !py-1 !px-2 text-[11px] item-bulto" value="${prefill.bulto || ''}" />
      </div>
      <span class="text-slate-600">Total: <strong class="text-sm font-extrabold text-amber-700 item-redondeo">$0</strong></span>
    </div>
  `;

  const txtInput = card.querySelector('.item-txt');
  const umeInput = card.querySelector('.item-ume');
  const pxqInput = card.querySelector('.item-pxq');
  const qtyInput = card.querySelector('.item-qty');

  const handleTxtChange = () => {
    const prod = state.productos.find(p => p.activo !== false && p.nombre.toLowerCase() === txtInput.value.trim().toLowerCase());
    if (prod) {
      pxqInput.value = prod.pxq;
      umeInput.value = prod.ume;
    }
    recalcTotals();
  };

  txtInput.addEventListener('input', handleTxtChange);
  txtInput.addEventListener('change', handleTxtChange);

  [pxqInput, qtyInput, umeInput].forEach(el => {
    el.addEventListener('input', recalcTotals);
    el.addEventListener('change', recalcTotals);
  });

  card.querySelector('.btn-del-row').addEventListener('click', () => {
    card.remove();
    recalcTotals();
  });

  container.appendChild(card);
  recalcTotals();
  if (autoFocus) txtInput.focus();
};

function recalcTotals() {
  const rows = Array.from(document.querySelectorAll('#cmd-items-body .item-row'));
  let sumValor = 0;
  let sumRedondeo = 0;
  let activeItems = [];

  rows.forEach((tr, idx) => {
    const txt = tr.querySelector('.item-txt').value.trim();
    const ume = tr.querySelector('.item-ume').value;
    const pxq = Number(tr.querySelector('.item-pxq').value) || 0;
    const qty = Number(tr.querySelector('.item-qty').value) || 0;
    const neto = calcNetoUnit(pxq);
    const valor = pxq * qty;
    const red = roundToHundred(valor);

    tr.querySelector('.item-neto').textContent = formatCLP(neto);
    tr.querySelector('.item-redondeo').textContent = formatCLP(red);

    sumValor += valor;
    sumRedondeo += red;

    if (txt || valor > 0) {
      activeItems.push({ idx, txt: txt || 'Ítem sin nombre', ume, qty, red });
    }
  });

  const netoTotal = sumRedondeo / 1.19;
  const ivaTotal = sumRedondeo - netoTotal;

  document.getElementById('sum-items').textContent = activeItems.length;
  document.getElementById('sum-neto').textContent = formatCLP(netoTotal);
  document.getElementById('sum-iva').textContent = formatCLP(ivaTotal);
  document.getElementById('sum-valor').textContent = formatCLP(sumValor);
  document.getElementById('sum-redondeo').textContent = formatCLP(sumRedondeo);

  const listEl = document.getElementById('sum-items-list');
  if (activeItems.length === 0) {
    listEl.innerHTML = '<div class="py-3 text-center text-xs text-slate-400">Sin artículos aún</div>';
  } else {
    listEl.innerHTML = activeItems.map(it => `
      <div class="py-2 flex items-center justify-between gap-2 text-xs">
        <div class="min-w-0 flex-1">
          <div class="font-semibold text-slate-800 truncate">${it.qty} ${it.ume} × ${it.txt}</div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="font-bold text-slate-900">${formatCLP(it.red)}</span>
          <button type="button" onclick="removeItemByIndex(${it.idx})" title="Descartar artículo" class="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    `).join('');
  }
}

window.removeItemByIndex = function(idx) {
  const rows = document.querySelectorAll('#cmd-items-body .item-row');
  if (rows[idx]) {
    rows[idx].remove();
    recalcTotals();
  }
};

window.copyResumenWhatsApp = function() {
  const oc = document.getElementById('cmd-oc').value.trim().toUpperCase();
  const cliente = document.getElementById('cmd-cliente').value.trim() || 'Cliente';
  const fechaEnt = document.getElementById('cmd-fecha-entrega').value;
  const hora = document.getElementById('cmd-eta-hora').value;
  const obs = document.getElementById('cmd-obs').value.trim();
  const total = document.getElementById('sum-redondeo').textContent;
  const textoFecha = formatTextoFecha(fechaEnt);

  const rows = Array.from(document.querySelectorAll('#cmd-items-body .item-row'));
  const lineas = rows.map(tr => {
    const txt = tr.querySelector('.item-txt').value.trim();
    const ume = tr.querySelector('.item-ume').value;
    const qty = Number(tr.querySelector('.item-qty').value) || 0;
    const pxq = Number(tr.querySelector('.item-pxq').value) || 0;
    const red = roundToHundred(pxq * qty);
    if (!txt) return null;
    return `• ${qty} ${ume} ${txt}: ${formatCLP(red)}`;
  }).filter(Boolean);

  if (lineas.length === 0) {
    return showToast('Agrega al menos un producto para copiar el resumen.', true);
  }

  const msg = [
    `*CONFIRMACIÓN DE PEDIDO ${oc}*`,
    `👤 *Cliente:* ${cliente}`,
    `📅 *Entrega:* ${textoFecha}${hora ? ` - ${hora} hrs` : ''}`,
    obs ? `📍 *Lugar:* ${obs}` : null,
    ``,
    `*Detalle:*`,
    ...lineas,
    ``,
    `💰 *Total:* ${total}`
  ].filter(v => v !== null).join('\n');

  navigator.clipboard.writeText(msg).then(() => {
    showToast('Resumen de confirmación copiado para WhatsApp.');
  }).catch(() => {
    showToast('No se pudo copiar automáticamente.', true);
  });
};

window.saveComanda = async function() {
  const oc = document.getElementById('cmd-oc').value.trim().toUpperCase();
  const cliente = document.getElementById('cmd-cliente').value.trim();
  const fechaPedido = document.getElementById('cmd-fecha-pedido').value;
  const fechaEntrega = document.getElementById('cmd-fecha-entrega').value;
  const hora = document.getElementById('cmd-eta-hora').value;

  if (!oc || !cliente || !fechaEntrega) {
    return showToast('Completa OC, Cliente y Fecha de entrega.', true);
  }

  const rows = Array.from(document.querySelectorAll('#cmd-items-body .item-row'));
  const items = rows.map((tr, idx) => {
    const txt = tr.querySelector('.item-txt').value.trim();
    const ume = tr.querySelector('.item-ume').value;
    const pxq = Number(tr.querySelector('.item-pxq').value) || 0;
    const qty = Number(tr.querySelector('.item-qty').value) || 0;
    const valor = pxq * qty;
    return {
      linea: idx + 1,
      txt,
      pxq,
      ume,
      qty: ume === 'kg' || ume === 'g' ? 1 : qty,
      peso: ume === 'kg' || ume === 'g' ? qty : 0,
      neto: Number(calcNetoUnit(pxq).toFixed(4)),
      valor,
      redondeo: roundToHundred(valor),
      bulto: tr.querySelector('.item-bulto')?.value.trim() || ''
    };
  }).filter(it => it.txt !== '');

  if (items.length === 0) {
    return showToast('Agrega al menos un producto a la comanda.', true);
  }

  const matchNum = oc.match(/(\d+)$/);
  const numeroCorrelativo = matchNum ? parseInt(matchNum[1], 10) : 291;
  const rsIdVal = document.getElementById('cmd-razon-social').value;
  const tipoServicio = document.getElementById('cmd-tipo-servicio').value;
  const obs = document.getElementById('cmd-obs').value.trim();
  const hrsEntrega = hora ? `ETA ${hora} HRS` : '';
  const textoFecha = formatTextoFecha(fechaEntrega);
  const descriptorServicio = `${tipoServicio} ${textoFecha} ${oc} ${obs} ${hrsEntrega}`.replace(/\s+/g, ' ').trim();
  const totalValor = items.reduce((s, i) => s + i.valor, 0);
  const totalRedondeado = items.reduce((s, i) => s + i.redondeo, 0);

  const payload = {
    numero_correlativo: numeroCorrelativo,
    oc,
    fecha_pedido: fechaPedido,
    hora_pedido: new Date().toTimeString().slice(0, 5),
    cliente_nombre: cliente,
    razon_social_id: rsIdVal ? parseInt(rsIdVal, 10) : null,
    tip_serv: document.getElementById('cmd-tip-serv').value,
    tipo_servicio: tipoServicio,
    fecha_entrega: fechaEntrega,
    fecha_elaboracion: document.getElementById('cmd-fecha-elaboracion').value || fechaEntrega,
    fecha_envasado: document.getElementById('cmd-fecha-envasado').value || fechaEntrega,
    hrs_entrega: hrsEntrega,
    obs,
    texto_fecha: textoFecha,
    descriptor_servicio: descriptorServicio,
    tipo_documento: document.getElementById('cmd-tipo-doc').value,
    total_valor: totalValor,
    total_redondeado: totalRedondeado,
    creado_por: state.currentUser?.nombre || 'Sistema'
  };

  if (state.editingComandaId) {
    // ACTUALIZAR PEDIDO EXISTENTE
    const editId = state.editingComandaId;
    if (state.isOnline && state.supabase) {
      const { error } = await state.supabase.from('comandas').update(payload).eq('id', editId);
      if (error) return showToast('Error actualizando pedido: ' + error.message, true);
      await state.supabase.from('comanda_items').delete().eq('comanda_id', editId);
      const { error: iErr } = await state.supabase.from('comanda_items').insert(items.map(it => ({ ...it, comanda_id: editId })));
      if (iErr) return showToast('Error guardando ítems: ' + iErr.message, true);
    }

    const idx = state.comandas.findIndex(c => c.id === editId);
    if (idx !== -1) {
      state.comandas[idx] = { ...state.comandas[idx], ...payload, items };
    }
    saveLocal();
    showToast(`Pedido ${oc} actualizado.`);
    await resetComandaForm();
    switchTab('historial');
    return;
  }

  // CREAR NUEVO PEDIDO
  const nuevaComanda = {
    id: Date.now(),
    ...payload,
    estado_produccion: 'Agendado',
    emision_dte: 'Pendiente',
    dte: null,
    estado_pago: 'Pendiente',
    items
  };

  if (state.isOnline && state.supabase) {
    try {
      const { items: cmdItems, id: _omit, ...cabecera } = nuevaComanda;
      const { data: inserted, error } = await state.supabase.from('comandas').insert(cabecera).select().single();
      if (error) throw error;
      const { error: itemsErr } = await state.supabase.from('comanda_items').insert(cmdItems.map(it => ({ ...it, comanda_id: inserted.id })));
      if (itemsErr) throw itemsErr;
      nuevaComanda.id = inserted.id;
    } catch (err) {
      console.error(err);
      return showToast('Error al guardar en Supabase: ' + err.message, true);
    }
  }

  await releaseReservation();
  state.comandas.unshift(nuevaComanda);
  saveLocal();
  showToast(`Comanda ${oc} guardada y agendada.`);
  await resetComandaForm();
  switchTab('agenda');
};

// ============================================================================
// AGENDA DE ENTREGAS
// ============================================================================
window.renderAgenda = function() {
  const container = document.getElementById('agenda-container');
  const filtroEstado = document.getElementById('agenda-filter-estado').value;
  const search = document.getElementById('agenda-search').value.trim().toLowerCase();

  let list = state.comandas.filter(c => {
    if (filtroEstado === 'activos') {
      if (c.estado_produccion === 'Entregado' || c.estado_produccion === 'Anulado') return false;
    } else if (filtroEstado !== 'todos') {
      if (c.estado_produccion !== filtroEstado) return false;
    }
    if (search) {
      const hay = `${c.oc} ${c.cliente_nombre} ${c.obs || ''} ${c.descriptor_servicio || ''}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  list.sort((a, b) => {
    if (a.fecha_entrega !== b.fecha_entrega) return (a.fecha_entrega || '').localeCompare(b.fecha_entrega || '');
    return (a.hrs_entrega || '').localeCompare(b.hrs_entrega || '');
  });

  if (list.length === 0) {
    container.innerHTML = `<div class="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">No hay comandas agendadas con ese filtro.</div>`;
    return;
  }

  const groups = {};
  list.forEach(c => {
    const key = c.fecha_entrega || 'Sin fecha';
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  });

  container.innerHTML = Object.entries(groups).map(([fecha, cmds]) => {
    const titulo = fecha !== 'Sin fecha' ? formatTextoFecha(fecha) : 'Sin fecha';

    // Consolidado de Producción Diario (suma cantidades por producto y UME, excluyendo Despacho)
    const consolidado = {};
    cmds.forEach(c => {
      (c.items || []).forEach(it => {
        if (!it.txt || it.txt.toLowerCase().startsWith('despacho')) return;
        const cant = (it.ume === 'kg' || it.ume === 'g') && it.peso ? Number(it.peso) : Number(it.qty);
        const key = `${it.txt}|||${it.ume}`;
        consolidado[key] = (consolidado[key] || 0) + (cant || 0);
      });
    });

    const consEntries = Object.entries(consolidado).map(([key, total]) => {
      const [nombre, ume] = key.split('|||');
      return { nombre, ume, total: Number(total.toFixed(3)) };
    }).sort((a, b) => b.total - a.total);

    const consHtml = consEntries.length ? `
      <div class="rounded-xl bg-amber-50/70 border border-amber-200 p-3 text-xs">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span class="font-bold text-amber-900">Consolidado de Producción (${titulo})</span>
          <button type="button" onclick="copyConsolidadoDia('${fecha}')" class="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-800 font-semibold hover:bg-amber-100 transition text-[11px]">
            Copiar para Cocina
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${consEntries.map(e => `
            <span class="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-slate-800">
              <strong class="text-amber-700">${e.total} ${e.ume}</strong> ${e.nombre}
            </span>
          `).join('')}
        </div>
      </div>
    ` : '';

    return `
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <span class="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold capitalize">${titulo}</span>
          <span class="text-xs text-slate-500">(${cmds.length} ${cmds.length === 1 ? 'pedido' : 'pedidos'})</span>
        </div>
        ${consHtml}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${cmds.map(c => renderAgendaCard(c)).join('')}
        </div>
      </div>
    `;
  }).join('');
};

window.copyConsolidadoDia = function(fecha) {
  const filtroEstado = document.getElementById('agenda-filter-estado').value;
  const cmds = state.comandas.filter(c => {
    if ((c.fecha_entrega || 'Sin fecha') !== fecha) return false;
    if (filtroEstado === 'activos') return c.estado_produccion !== 'Entregado' && c.estado_produccion !== 'Anulado';
    if (filtroEstado !== 'todos') return c.estado_produccion === filtroEstado;
    return true;
  });

  const consolidado = {};
  cmds.forEach(c => {
    (c.items || []).forEach(it => {
      if (!it.txt || it.txt.toLowerCase().startsWith('despacho')) return;
      const cant = (it.ume === 'kg' || it.ume === 'g') && it.peso ? Number(it.peso) : Number(it.qty);
      const key = `${it.txt}|||${it.ume}`;
      consolidado[key] = (consolidado[key] || 0) + (cant || 0);
    });
  });

  const titulo = fecha !== 'Sin fecha' ? formatTextoFecha(fecha) : 'Sin fecha';
  const lines = Object.entries(consolidado).map(([key, total]) => {
    const [nombre, ume] = key.split('|||');
    return `• ${Number(total.toFixed(3))} ${ume} × ${nombre}`;
  });

  if (!lines.length) return showToast('No hay productos para copiar en este día.', true);
  const text = `*CONSOLIDADO PRODUCCIÓN — ${titulo.toUpperCase()}*\n(${cmds.length} pedidos)\n\n${lines.join('\n')}`;
  navigator.clipboard.writeText(text).then(() => showToast('Consolidado copiado para Cocina.'));
};

function renderAgendaCard(c) {
  const isUrgente = c.tipo_servicio === 'Servicio urgente';
  const itemsHtml = (c.items || []).map(i => `
    <li class="flex justify-between text-xs py-0.5 gap-2">
      <span class="text-slate-700">
        <strong>${i.ume === 'kg' || i.ume === 'g' ? i.peso + ' ' + i.ume : i.qty}</strong> × ${i.txt}
        ${i.bulto ? `<span class="ml-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">Bulto: ${i.bulto}</span>` : ''}
      </span>
      <span class="text-slate-500 font-mono shrink-0">${formatCLP(i.redondeo)}</span>
    </li>
  `).join('');

  const elabInfo = (c.fecha_elaboracion || c.fecha_envasado)
    ? `<div class="text-[11px] text-slate-500 mb-1">Elab: ${c.fecha_elaboracion || '-'} • Env: ${c.fecha_envasado || '-'}</div>`
    : '';

  return `
    <div class="bg-white rounded-2xl border ${isUrgente ? 'border-rose-300 ring-1 ring-rose-100' : 'border-slate-200'} p-4 shadow-sm flex flex-col justify-between gap-3">
      <div>
        <div class="flex items-start justify-between gap-2 mb-2">
          <div>
            <span class="text-sm font-extrabold text-amber-700">${c.oc}</span>
            <span class="ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${isUrgente ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}">
              ${c.tipo_servicio} ${c.tip_serv || ''}
            </span>
          </div>
          <span class="text-xs font-bold text-slate-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
            ${c.hrs_entrega || 'Sin ETA'}
          </span>
        </div>

        <div class="text-sm font-bold text-slate-900">${c.cliente_nombre}</div>
        <div class="text-xs text-slate-600 mb-1">${c.obs || 'Sin observaciones de lugar'}</div>
        ${elabInfo}

        <ul class="border-t border-b border-slate-100 py-2 my-2 space-y-0.5">
          ${itemsHtml}
        </ul>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div class="text-sm font-extrabold text-slate-900">Total: ${formatCLP(c.total_redondeado)}</div>
        <div class="flex items-center gap-2">
          <select onchange="updateComandaEstado(${c.id}, this.value)" class="input-field !w-auto !py-1 !px-2 text-xs font-semibold">
            <option value="Agendado" ${c.estado_produccion === 'Agendado' ? 'selected' : ''}>Agendado</option>
            <option value="En Producción" ${c.estado_produccion === 'En Producción' ? 'selected' : ''}>En Producción</option>
            <option value="Entregado" ${c.estado_produccion === 'Entregado' ? 'selected' : ''}>Entregado</option>
          </select>
          <button onclick="printComanda(${c.id})" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">Ticket</button>
        </div>
      </div>
    </div>
  `;
}

window.updateComandaEstado = async function(id, nuevoEstado) {
  const c = state.comandas.find(x => x.id === id);
  if (!c) return;
  c.estado_produccion = nuevoEstado;
  if (state.isOnline && state.supabase) {
    await state.supabase.from('comandas').update({ estado_produccion: nuevoEstado }).eq('id', id);
  }
  saveLocal();
  showToast(`${c.oc} → ${nuevoEstado}`);
  renderAgenda();
};

window.printComanda = function(id) {
  const c = state.comandas.find(x => x.id === id);
  if (!c) return;
  const rs = state.razonesSociales.find(r => r.id === c.razon_social_id);

  document.getElementById('print-content').innerHTML = `
    <div class="text-center border-b border-slate-200 pb-3">
      <div class="text-lg font-extrabold">COMANDA ${c.oc}</div>
      <div class="text-xs text-slate-500">${c.descriptor_servicio}</div>
    </div>
    <div class="grid grid-cols-2 gap-2 text-xs">
      <div><strong>Cliente:</strong> ${c.cliente_nombre}</div>
      <div><strong>Razón Social:</strong> ${rs ? rs.razon_social : 'Particular'}</div>
      <div><strong>Entrega:</strong> ${c.fecha_entrega} (${c.hrs_entrega})</div>
      <div><strong>Lugar:</strong> ${c.obs || '-'}</div>
      <div><strong>Elaboración:</strong> ${c.fecha_elaboracion || '-'}</div>
      <div><strong>Envasado:</strong> ${c.fecha_envasado || '-'}</div>
    </div>
    <table class="w-full text-xs border-t border-b border-slate-200 my-2">
      <thead><tr class="text-left border-b"><th class="py-1">Cant</th><th>Descripción</th><th>Bulto</th><th class="text-right">Total</th></tr></thead>
      <tbody>
        ${(c.items || []).map(i => `
          <tr>
            <td class="py-1 font-bold">${i.ume === 'kg' || i.ume === 'g' ? i.peso + i.ume : i.qty}</td>
            <td>${i.txt}</td>
            <td class="text-slate-500">${i.bulto || '-'}</td>
            <td class="text-right">${formatCLP(i.redondeo)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="flex justify-between font-extrabold text-base">
      <span>TOTAL</span>
      <span>${formatCLP(c.total_redondeado)}</span>
    </div>
  `;
  document.getElementById('modal-print').classList.remove('hidden');
};

// ============================================================================
// HISTORIAL, MANTENEDOR DE PEDIDOS, DTE, PAGOS Y EXPORTACIÓN CSV
// ============================================================================
window.renderHistorial = function() {
  const resumenDiv = document.getElementById('resumen-razon-social');
  const totalsByRS = {};
  state.razonesSociales.forEach(rs => { totalsByRS[rs.id] = 0; });

  state.comandas.forEach(c => {
    if (c.estado_pago === 'Pendiente' && c.razon_social_id) {
      totalsByRS[c.razon_social_id] = (totalsByRS[c.razon_social_id] || 0) + (Number(c.total_valor) || 0);
    }
  });

  resumenDiv.innerHTML = state.razonesSociales.map(rs => {
    const monto = totalsByRS[rs.id] || 0;
    return `
      <div class="p-3 rounded-xl border ${monto > 0 ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200 bg-slate-50'}">
        <div class="text-[11px] font-bold text-slate-500">ID ${rs.id} • ${rs.rut || 'Sin RUT'}</div>
        <div class="text-xs font-bold text-slate-900 truncate" title="${rs.razon_social}">${rs.razon_social}</div>
        <div class="text-base font-extrabold mt-1 ${monto > 0 ? 'text-amber-700' : 'text-slate-400'}">${formatCLP(monto)}</div>
      </div>
    `;
  }).join('');

  const search = document.getElementById('hist-search').value.trim().toLowerCase();
  const tbody = document.getElementById('historial-body');
  const filtered = state.comandas.filter(c => {
    if (!search) return true;
    const rs = state.razonesSociales.find(r => r.id === c.razon_social_id);
    return `${c.oc} ${c.dte || ''} ${c.cliente_nombre} ${rs?.razon_social || ''}`.toLowerCase().includes(search);
  });

  tbody.innerHTML = filtered.map(c => {
    const rs = state.razonesSociales.find(r => r.id === c.razon_social_id);
    return `
      <tr class="hover:bg-slate-50">
        <td class="py-2.5 pr-3 font-bold text-amber-700">${c.oc}</td>
        <td class="py-2.5 px-2 text-slate-600">${c.fecha_pedido || '-'}</td>
        <td class="py-2.5 px-2 text-slate-600">${c.fecha_entrega || '-'}</td>
        <td class="py-2.5 px-2">
          <div class="font-semibold text-slate-900">${c.cliente_nombre}</div>
          <div class="text-[11px] text-slate-500">${rs ? rs.razon_social : 'Particular'}</div>
        </td>
        <td class="py-2.5 px-2 text-right font-bold text-slate-900">${formatCLP(c.total_valor)}</td>
        <td class="py-2.5 px-2">
          <input type="number" value="${c.dte || ''}" placeholder="Nº DTE" onchange="updateDTE(${c.id}, this.value)" class="input-field !w-20 !py-1 !px-1.5 text-xs" />
        </td>
        <td class="py-2.5 px-2">
          <select onchange="updateEmisionDTE(${c.id}, this.value)" class="input-field !w-24 !py-1 !px-1.5 text-xs">
            <option value="Pendiente" ${c.emision_dte === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="Emitida" ${c.emision_dte === 'Emitida' ? 'selected' : ''}>Emitida</option>
          </select>
        </td>
        <td class="py-2.5 px-2">
          <select onchange="updatePago(${c.id}, this.value)" class="input-field !w-24 !py-1 !px-1.5 text-xs font-semibold ${c.estado_pago === 'Pendiente' ? 'text-amber-700' : 'text-emerald-700'}">
            <option value="Pendiente" ${c.estado_pago === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="Recibido" ${c.estado_pago === 'Recibido' ? 'selected' : ''}>Recibido</option>
            <option value="PAGO" ${c.estado_pago === 'PAGO' ? 'selected' : ''}>PAGO</option>
          </select>
        </td>
        <td class="py-2.5 pl-2 text-right whitespace-nowrap space-x-1.5">
          <button onclick="printComanda(${c.id})" class="text-xs font-semibold text-slate-600 hover:text-slate-900 underline">Ver</button>
          <button onclick="editComanda(${c.id})" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline">Editar</button>
          <button onclick="deleteComanda(${c.id})" class="text-xs font-semibold text-rose-600 hover:text-rose-800 underline">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');
};

window.deleteComanda = async function(id) {
  const c = state.comandas.find(x => x.id === id);
  if (!c || !confirm(`¿Eliminar definitivamente el pedido ${c.oc}?`)) return;
  if (state.isOnline && state.supabase) {
    const { error } = await state.supabase.from('comandas').delete().eq('id', id);
    if (error) return showToast(error.message, true);
  }
  state.comandas = state.comandas.filter(x => x.id !== id);
  saveLocal();
  renderHistorial();
  renderAgenda();
  showToast(`Pedido ${c.oc} eliminado.`);
};

window.updateDTE = async function(id, dteVal) {
  const c = state.comandas.find(x => x.id === id);
  if (!c) return;
  c.dte = dteVal ? parseInt(dteVal, 10) : null;
  if (state.isOnline && state.supabase) {
    await state.supabase.from('comandas').update({ dte: c.dte }).eq('id', id);
  }
  saveLocal();
  showToast(`DTE actualizado en ${c.oc}`);
};

window.updateEmisionDTE = async function(id, val) {
  const c = state.comandas.find(x => x.id === id);
  if (!c) return;
  c.emision_dte = val;
  if (state.isOnline && state.supabase) {
    await state.supabase.from('comandas').update({ emision_dte: val }).eq('id', id);
  }
  saveLocal();
};

window.updatePago = async function(id, val) {
  const c = state.comandas.find(x => x.id === id);
  if (!c) return;
  c.estado_pago = val;
  if (state.isOnline && state.supabase) {
    await state.supabase.from('comandas').update({ estado_pago: val }).eq('id', id);
  }
  saveLocal();
  renderHistorial();
};

window.exportToCSV = function() {
  const headers = [
    'Fecha pedido', 'Cliente', 'OC', 'Tip. Serv', 'txt', 'pxq', 'ume', 'Qty',
    'Neto', 'peso', 'Valor', 'redondeo', 'Fecha entrega venta_ Cliente',
    'Hrs entrega', 'Obs', 'Tipo servicio', 'Descriptor servicio', 'Estado',
    'Emisión DTE', 'Texto fecha', 'DTE', 'Pago'
  ];

  const rows = [headers.join(';')];
  state.comandas.forEach(c => {
    (c.items || []).forEach(it => {
      const line = [
        c.fecha_pedido || '',
        c.cliente_nombre || '',
        c.oc || '',
        c.tip_serv || '',
        `"${(it.txt || '').replace(/"/g, '""')}"`,
        it.pxq,
        it.ume,
        it.qty,
        String(it.neto).replace('.', ','),
        it.peso || '',
        it.valor,
        it.redondeo,
        c.fecha_entrega || '',
        c.hrs_entrega || '',
        `"${(c.obs || '').replace(/"/g, '""')}"`,
        c.tipo_servicio || '',
        `"${(c.descriptor_servicio || '').replace(/"/g, '""')}"`,
        c.estado_produccion || '',
        c.emision_dte || '',
        c.texto_fecha || '',
        c.dte || '',
        c.estado_pago || ''
      ];
      rows.push(line.join(';'));
    });
  });

  const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ERP_ZUZA_Comandas_${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exportado con las columnas de tu planilla.');
};

// ============================================================================
// MANTENEDORES: PRODUCTOS (VISIBLE/OCULTO), CLIENTES, RAZONES SOCIALES, USUARIOS
// ============================================================================
window.renderCatalogo = function() {
  // 1. Productos
  const qProd = (document.getElementById('search-mant-prod')?.value || '').trim().toLowerCase();
  const prodList = document.getElementById('catalogo-productos-list');
  const prodsFiltered = state.productos.filter(p => !qProd || p.nombre.toLowerCase().includes(qProd));

  prodList.innerHTML = prodsFiltered.map(p => {
    const visible = p.activo !== false;
    return `
      <div class="py-2 flex items-center justify-between gap-2 ${visible ? '' : 'opacity-60'}">
        <div class="min-w-0 flex-1">
          <div class="font-semibold text-slate-900 truncate">${p.nombre}</div>
          <div class="text-[11px] text-slate-500">${p.ume} • <strong class="text-amber-700">${formatCLP(p.pxq)}</strong></div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button onclick="toggleProductoActivo(${p.id})" class="px-2 py-0.5 rounded-full text-[11px] font-bold border transition ${visible ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'}">
            ${visible ? 'Visible' : 'Oculto'}
          </button>
          <button onclick="editProducto(${p.id})" class="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold">Editar</button>
          <button onclick="deleteProducto(${p.id})" class="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold">&times;</button>
        </div>
      </div>
    `;
  }).join('');

  // 2. Contactos
  const qCont = (document.getElementById('search-mant-cont')?.value || '').trim().toLowerCase();
  const contList = document.getElementById('catalogo-contactos-list');
  const contsFiltered = state.contactos.filter(c => !qCont || c.nombre.toLowerCase().includes(qCont));

  contList.innerHTML = contsFiltered.map(c => {
    const rs = state.razonesSociales.find(r => r.id === c.razon_social_id);
    return `
      <div class="py-2 flex items-center justify-between gap-2">
        <div class="min-w-0 flex-1">
          <div class="font-semibold text-slate-900 truncate">${c.nombre}</div>
          <div class="text-[11px] text-slate-500 truncate">${rs ? rs.razon_social : 'Particular'} • ${c.destino_habitual || '-'}</div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button onclick="editContacto(${c.id})" class="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold">Editar</button>
          <button onclick="deleteContacto(${c.id})" class="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold">&times;</button>
        </div>
      </div>
    `;
  }).join('');

  // 3. Razones Sociales
  const rsList = document.getElementById('catalogo-rs-list');
  rsList.innerHTML = state.razonesSociales.map(rs => `
    <div class="py-2 flex items-center justify-between gap-2">
      <div class="min-w-0 flex-1">
        <div class="font-semibold text-slate-900 truncate">${rs.razon_social}</div>
        <div class="text-[11px] text-slate-500">ID ${rs.id} • RUT: ${rs.rut || 'Sin RUT'}</div>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button onclick="editRazonSocial(${rs.id})" class="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold">Editar</button>
        <button onclick="deleteRazonSocial(${rs.id})" class="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold">&times;</button>
      </div>
    </div>
  `).join('');

  // 4. Usuarios
  const usrList = document.getElementById('catalogo-usuarios-list');
  usrList.innerHTML = state.usuarios.map(u => `
    <div class="py-2 flex items-center justify-between gap-2">
      <div class="min-w-0 flex-1">
        <div class="font-semibold text-slate-900 truncate">${u.nombre}</div>
        <div class="text-[11px] text-slate-500">Rol: ${u.rol} • PIN: ${u.pin}</div>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button onclick="editUsuario(${u.id})" class="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold">Editar</button>
        <button onclick="deleteUsuario(${u.id})" class="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold">&times;</button>
      </div>
    </div>
  `).join('');
};

// --- CRUD PRODUCTOS ---
window.saveProducto = async function() {
  const editId = document.getElementById('edit-prod-id').value;
  const nombre = document.getElementById('new-prod-nombre').value.trim();
  const pxq = Number(document.getElementById('new-prod-pxq').value) || 0;
  const ume = document.getElementById('new-prod-ume').value;
  if (!nombre) return showToast('Ingresa el nombre del producto.', true);

  if (editId) {
    const idNum = Number(editId);
    const p = state.productos.find(x => x.id === idNum);
    if (!p) return;
    if (state.isOnline && state.supabase) {
      const { error } = await state.supabase.from('productos').update({ nombre, pxq, ume }).eq('id', idNum);
      if (error) return showToast(error.message, true);
    }
    p.nombre = nombre; p.pxq = pxq; p.ume = ume;
    showToast('Producto actualizado.');
  } else {
    const prod = { id: Date.now(), nombre, pxq, ume, categoria: 'Personalizado', activo: true };
    if (state.isOnline && state.supabase) {
      const { id: _omit, ...payload } = prod;
      const { data, error } = await state.supabase.from('productos').insert(payload).select().single();
      if (error) return showToast(error.message, true);
      prod.id = data.id;
    }
    state.productos.push(prod);
    showToast('Producto creado.');
  }

  cancelEditProducto();
  saveLocal();
  populateSelects();
  renderCatalogo();
};

window.editProducto = function(id) {
  const p = state.productos.find(x => x.id === id);
  if (!p) return;
  document.getElementById('edit-prod-id').value = p.id;
  document.getElementById('new-prod-nombre').value = p.nombre;
  document.getElementById('new-prod-pxq').value = p.pxq;
  document.getElementById('new-prod-ume').value = p.ume;
  document.getElementById('btn-cancel-prod').classList.remove('hidden');
};

window.cancelEditProducto = function() {
  document.getElementById('edit-prod-id').value = '';
  document.getElementById('new-prod-nombre').value = '';
  document.getElementById('new-prod-pxq').value = '';
  document.getElementById('btn-cancel-prod').classList.add('hidden');
};

window.toggleProductoActivo = async function(id) {
  const p = state.productos.find(x => x.id === id);
  if (!p) return;
  const nuevo = !(p.activo !== false);
  if (state.isOnline && state.supabase) {
    const { error } = await state.supabase.from('productos').update({ activo: nuevo }).eq('id', id);
    if (error) return showToast(error.message, true);
  }
  p.activo = nuevo;
  saveLocal();
  populateSelects();
  renderCatalogo();
  showToast(`${p.nombre}: ${nuevo ? 'Visible en pedidos' : 'Oculto en pedidos'}`);
};

window.deleteProducto = async function(id) {
  const p = state.productos.find(x => x.id === id);
  if (!p || !confirm(`¿Eliminar "${p.nombre}" del catálogo?`)) return;
  if (state.isOnline && state.supabase) {
    const { error } = await state.supabase.from('productos').delete().eq('id', id);
    if (error) return showToast(error.message, true);
  }
  state.productos = state.productos.filter(x => x.id !== id);
  saveLocal();
  populateSelects();
  renderCatalogo();
  showToast('Producto eliminado.');
};

// --- CRUD CONTACTOS ---
window.saveContacto = async function() {
  const editId = document.getElementById('edit-cont-id').value;
  const nombre = document.getElementById('new-cont-nombre').value.trim();
  const rsVal = document.getElementById('new-cont-rs').value;
  const destino = document.getElementById('new-cont-destino').value.trim();
  if (!nombre) return showToast('Ingresa el nombre del contacto.', true);

  const rsId = rsVal ? parseInt(rsVal, 10) : null;
  if (editId) {
    const idNum = Number(editId);
    const c = state.contactos.find(x => x.id === idNum);
    if (!c) return;
    if (state.isOnline && state.supabase) {
      const { error } = await state.supabase.from('contactos').update({ nombre, razon_social_id: rsId, destino_habitual: destino }).eq('id', idNum);
      if (error) return showToast(error.message, true);
    }
    c.nombre = nombre; c.razon_social_id = rsId; c.destino_habitual = destino;
    showToast('Contacto actualizado.');
  } else {
    const cont = { id: Date.now(), nombre, razon_social_id: rsId, destino_habitual: destino, despacho_habitual: 0 };
    if (state.isOnline && state.supabase) {
      const { id: _omit, ...payload } = cont;
      const { data, error } = await state.supabase.from('contactos').insert(payload).select().single();
      if (error) return showToast(error.message, true);
      cont.id = data.id;
    }
    state.contactos.push(cont);
    showToast('Contacto creado.');
  }

  cancelEditContacto();
  saveLocal();
  populateSelects();
  renderCatalogo();
};

window.editContacto = function(id) {
  const c = state.contactos.find(x => x.id === id);
  if (!c) return;
  document.getElementById('edit-cont-id').value = c.id;
  document.getElementById('new-cont-nombre').value = c.nombre;
  document.getElementById('new-cont-rs').value = c.razon_social_id || '';
  document.getElementById('new-cont-destino').value = c.destino_habitual || '';
  document.getElementById('btn-cancel-cont').classList.remove('hidden');
};

window.cancelEditContacto = function() {
  document.getElementById('edit-cont-id').value = '';
  document.getElementById('new-cont-nombre').value = '';
  document.getElementById('new-cont-rs').value = '';
  document.getElementById('new-cont-destino').value = '';
  document.getElementById('btn-cancel-cont').classList.add('hidden');
};

window.deleteContacto = async function(id) {
  const c = state.contactos.find(x => x.id === id);
  if (!c || !confirm(`¿Eliminar contacto "${c.nombre}"?`)) return;
  if (state.isOnline && state.supabase) {
    const { error } = await state.supabase.from('contactos').delete().eq('id', id);
    if (error) return showToast(error.message, true);
  }
  state.contactos = state.contactos.filter(x => x.id !== id);
  saveLocal();
  populateSelects();
  renderCatalogo();
  showToast('Contacto eliminado.');
};

// --- CRUD RAZONES SOCIALES ---
window.saveRazonSocial = async function() {
  const editId = document.getElementById('edit-rs-id').value;
  const rut = document.getElementById('new-rs-rut').value.trim();
  const razon_social = document.getElementById('new-rs-nombre').value.trim();
  if (!razon_social) return showToast('Ingresa la Razón Social.', true);

  if (editId) {
    const idNum = Number(editId);
    const rs = state.razonesSociales.find(x => x.id === idNum);
    if (!rs) return;
    if (state.isOnline && state.supabase) {
      const { error } = await state.supabase.from('razones_sociales').update({ rut, razon_social }).eq('id', idNum);
      if (error) return showToast(error.message, true);
    }
    rs.rut = rut; rs.razon_social = razon_social;
    showToast('Razón Social actualizada.');
  } else {
    const nextId = state.razonesSociales.reduce((m, r) => Math.max(m, Number(r.id) || 0), 15) + 1;
    const rs = { id: nextId, rut, razon_social, contacto_principal: '' };
    if (state.isOnline && state.supabase) {
      const { error } = await state.supabase.from('razones_sociales').insert(rs);
      if (error) return showToast(error.message, true);
    }
    state.razonesSociales.push(rs);
    showToast('Razón Social creada.');
  }

  cancelEditRazonSocial();
  saveLocal();
  populateSelects();
  renderCatalogo();
};

window.editRazonSocial = function(id) {
  const rs = state.razonesSociales.find(x => x.id === id);
  if (!rs) return;
  document.getElementById('edit-rs-id').value = rs.id;
  document.getElementById('new-rs-rut').value = rs.rut || '';
  document.getElementById('new-rs-nombre').value = rs.razon_social;
  document.getElementById('btn-cancel-rs').classList.remove('hidden');
};

window.cancelEditRazonSocial = function() {
  document.getElementById('edit-rs-id').value = '';
  document.getElementById('new-rs-rut').value = '';
  document.getElementById('new-rs-nombre').value = '';
  document.getElementById('btn-cancel-rs').classList.add('hidden');
};

window.deleteRazonSocial = async function(id) {
  const rs = state.razonesSociales.find(x => x.id === id);
  if (!rs || !confirm(`¿Eliminar "${rs.razon_social}"?`)) return;
  if (state.isOnline && state.supabase) {
    const { error } = await state.supabase.from('razones_sociales').delete().eq('id', id);
    if (error) return showToast(error.message, true);
  }
  state.razonesSociales = state.razonesSociales.filter(x => x.id !== id);
  saveLocal();
  populateSelects();
  renderCatalogo();
  showToast('Razón Social eliminada.');
};

// --- CRUD USUARIOS ---
window.saveUsuario = async function() {
  const editId = document.getElementById('edit-usr-id').value;
  const nombre = document.getElementById('new-usr-nombre').value.trim();
  const pin = document.getElementById('new-usr-pin').value.trim() || '1234';
  const rol = document.getElementById('new-usr-rol').value;
  if (!nombre) return showToast('Ingresa el nombre del usuario.', true);

  if (editId) {
    const idNum = Number(editId);
    const u = state.usuarios.find(x => x.id === idNum);
    if (!u) return;
    if (state.isOnline && state.supabase) {
      const { error } = await state.supabase.from('usuarios').update({ nombre, pin, rol }).eq('id', idNum);
      if (error) return showToast(error.message, true);
    }
    u.nombre = nombre; u.pin = pin; u.rol = rol;
    showToast('Usuario actualizado.');
  } else {
    const usr = { id: Date.now(), nombre, pin, rol, activo: true };
    if (state.isOnline && state.supabase) {
      const { id: _omit, ...payload } = usr;
      const { data, error } = await state.supabase.from('usuarios').insert(payload).select().single();
      if (error) return showToast(error.message, true);
      usr.id = data.id;
    }
    state.usuarios.push(usr);
    showToast('Usuario creado.');
  }

  cancelEditUsuario();
  saveLocal();
  renderCatalogo();
};

window.editUsuario = function(id) {
  const u = state.usuarios.find(x => x.id === id);
  if (!u) return;
  document.getElementById('edit-usr-id').value = u.id;
  document.getElementById('new-usr-nombre').value = u.nombre;
  document.getElementById('new-usr-pin').value = u.pin;
  document.getElementById('new-usr-rol').value = u.rol;
  document.getElementById('btn-cancel-usr').classList.remove('hidden');
};

window.cancelEditUsuario = function() {
  document.getElementById('edit-usr-id').value = '';
  document.getElementById('new-usr-nombre').value = '';
  document.getElementById('new-usr-pin').value = '';
  document.getElementById('btn-cancel-usr').classList.add('hidden');
};

window.deleteUsuario = async function(id) {
  const u = state.usuarios.find(x => x.id === id);
  if (!u || !confirm(`¿Eliminar usuario "${u.nombre}"?`)) return;
  if (state.isOnline && state.supabase) {
    const { error } = await state.supabase.from('usuarios').delete().eq('id', id);
    if (error) return showToast(error.message, true);
  }
  state.usuarios = state.usuarios.filter(x => x.id !== id);
  saveLocal();
  renderCatalogo();
  showToast('Usuario eliminado.');
};

// ============================================================================
// CALCULADORA DE DESPACHO (HH + KM + MARGEN + IVA)
// ============================================================================
let lastCalcTotal = 0;

window.openCalcModal = function() {
  document.getElementById('modal-calc').classList.remove('hidden');
  recalcDespacho();
};

window.closeCalcModal = function() {
  document.getElementById('modal-calc').classList.add('hidden');
};

window.recalcDespacho = function() {
  const sueldo = Number(document.getElementById('calc-sueldo').value) || 0;
  const minutos = Number(document.getElementById('calc-minutos').value) || 0;
  const bencina = Number(document.getElementById('calc-bencina').value) || 0;
  const kml = Number(document.getElementById('calc-kml').value) || 1;
  const km = Number(document.getElementById('calc-km').value) || 0;
  const margen = Number(document.getElementById('calc-margen').value) || 0;

  const valorHora = sueldo / 176;
  const costoHH = valorHora * (minutos / 60);
  const valorKm = (bencina / kml) * 1.2;
  const costoTraslado = valorKm * km;
  const subtotal = (costoHH + costoTraslado) * (1 + margen);
  const conIva = subtotal * 1.19;
  lastCalcTotal = roundToHundred(conIva);

  document.getElementById('calc-res-hh').textContent = formatCLP(costoHH);
  document.getElementById('calc-res-traslado').textContent = formatCLP(costoTraslado);
  document.getElementById('calc-res-total').textContent = formatCLP(lastCalcTotal);
};

window.insertDespachoFromCalc = function() {
  addItemRow({ txt: 'Despacho', ume: 'un', pxq: lastCalcTotal, qty: 1 });
  closeCalcModal();
  showToast(`Despacho de ${formatCLP(lastCalcTotal)} agregado a la comanda.`);
};

// ============================================================================
// CONEXIÓN Y SINCRONIZACIÓN CON SUPABASE
// ============================================================================
window.saveSupabaseConfig = async function() {
  const url = document.getElementById('cfg-sb-url').value.trim();
  const key = document.getElementById('cfg-sb-key').value.trim();
  if (!url || !key) return showToast('Ingresa ambos campos de Supabase.', true);

  localStorage.setItem(STORAGE_KEYS.SB_URL, url);
  localStorage.setItem(STORAGE_KEYS.SB_KEY, key);

  try {
    state.supabase = window.supabase.createClient(url, key);
    await loadFromSupabase();
    setConnectionBadge(true);
    populateSelects();
    await resetComandaForm();
    renderAgenda();
    renderHistorial();
    renderCatalogo();
    showToast('Conectado exitosamente a Supabase Online.');
  } catch (err) {
    console.error(err);
    setConnectionBadge(false);
    showToast('Error conectando a Supabase: ' + err.message, true);
  }
};

window.syncLocalToSupabase = async function() {
  if (!state.supabase) return showToast('Primero guarda y conecta tu URL y Key de Supabase.', true);
  const localCmds = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMANDAS) || '[]');
  let count = 0;

  for (const c of localCmds) {
    const { data: exists } = await state.supabase.from('comandas').select('id').eq('oc', c.oc).maybeSingle();
    if (!exists) {
      const { items, id: _omit, ...cabecera } = c;
      const { data: inserted, error } = await state.supabase.from('comandas').insert(cabecera).select().single();
      if (!error && inserted && items?.length) {
        await state.supabase.from('comanda_items').insert(items.map(it => ({ ...it, comanda_id: inserted.id })));
        count++;
      }
    }
  }
  await loadFromSupabase();
  renderAgenda();
  renderHistorial();
  showToast(`Sincronización lista: ${count} comandas nuevas subidas a Supabase.`);
};

window.disconnectSupabase = async function() {
  localStorage.removeItem(STORAGE_KEYS.SB_URL);
  localStorage.removeItem(STORAGE_KEYS.SB_KEY);
  state.supabase = null;
  loadFromLocal();
  setConnectionBadge(false);
  populateSelects();
  await resetComandaForm();
  renderAgenda();
  renderHistorial();
  renderCatalogo();
  showToast('Modo Local activado.');
};

init();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
