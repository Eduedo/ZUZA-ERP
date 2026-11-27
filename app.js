import {
  SEED_RAZONES_SOCIALES,
  SEED_CONTACTOS,
  SEED_PRODUCTOS,
  SEED_COMANDAS
} from './seed-data.js';

// ============================================================================
// ESTADO GLOBAL Y CONFIGURACIÓN
// ============================================================================
const STORAGE_KEYS = {
  RAZONES: 'zuza_razones_sociales',
  CONTACTOS: 'zuza_contactos',
  PRODUCTOS: 'zuza_productos',
  COMANDAS: 'zuza_comandas',
  SB_URL: 'zuza_sb_url',
  SB_KEY: 'zuza_sb_key'
};

let state = {
  razonesSociales: [],
  contactos: [],
  productos: [],
  comandas: [],
  supabase: null,
  isOnline: false
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
  const diaSemana = DIAS[dt.getDay()];
  const diaNum = String(d).padStart(2, '0');
  const mes = MESES[m - 1];
  return `${diaSemana} ${diaNum} de ${mes}`;
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
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function tomorrowISO() {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

  populateSelects();
  resetComandaForm();
  renderAgenda();
  renderHistorial();
  renderCatalogo();
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

  state.razonesSociales = JSON.parse(localStorage.getItem(STORAGE_KEYS.RAZONES));
  state.contactos = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTACTOS));
  state.productos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTOS));
  state.comandas = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMANDAS));
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEYS.RAZONES, JSON.stringify(state.razonesSociales));
  localStorage.setItem(STORAGE_KEYS.CONTACTOS, JSON.stringify(state.contactos));
  localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(state.productos));
  localStorage.setItem(STORAGE_KEYS.COMANDAS, JSON.stringify(state.comandas));
}

async function loadFromSupabase() {
  const sb = state.supabase;
  const [rsRes, contRes, prodRes, cmdRes] = await Promise.all([
    sb.from('razones_sociales').select('*').order('id'),
    sb.from('contactos').select('*').order('nombre'),
    sb.from('productos').select('*').order('nombre'),
    sb.from('comandas').select('*, comanda_items(*)').order('numero_correlativo', { ascending: false })
  ]);

  if (rsRes.error) throw rsRes.error;
  if (contRes.error) throw contRes.error;
  if (prodRes.error) throw prodRes.error;
  if (cmdRes.error) throw cmdRes.error;

  state.razonesSociales = rsRes.data.length ? rsRes.data : SEED_RAZONES_SOCIALES;
  state.contactos = contRes.data.length ? contRes.data : SEED_CONTACTOS;
  state.productos = prodRes.data.length ? prodRes.data : SEED_PRODUCTOS;
  state.comandas = cmdRes.data.map(c => ({
    ...c,
    items: (c.comanda_items || []).sort((a, b) => a.linea - b.linea)
  }));
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

function getNextCorrelativo() {
  const maxNum = state.comandas.reduce((max, c) => Math.max(max, Number(c.numero_correlativo) || 0), 290);
  return maxNum + 1;
}

function updateNextOCBadge() {
  const next = getNextCorrelativo();
  document.getElementById('next-oc-badge').textContent = `Próxima OC: ZRA-${next}`;
}

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

  const dlProductos = document.getElementById('lista-productos');
  dlProductos.innerHTML = state.productos.map(p => `<option value="${p.nombre}">`).join('');
}

// ============================================================================
// FORMULARIO NUEVA COMANDA
// ============================================================================
window.resetComandaForm = function() {
  const nextNum = getNextCorrelativo();
  updateNextOCBadge();

  document.getElementById('cmd-oc').value = `ZRA-${nextNum}`;
  document.getElementById('cmd-fecha-pedido').value = todayISO();
  document.getElementById('cmd-fecha-entrega').value = tomorrowISO();
  document.getElementById('cmd-eta-hora').value = '12:00';
  document.getElementById('cmd-tipo-doc').value = 'Factura';
  document.getElementById('cmd-cliente').value = '';
  document.getElementById('cmd-razon-social').value = '';
  document.getElementById('cmd-tipo-servicio').value = 'Servicio';
  document.getElementById('cmd-tip-serv').value = '';
  document.getElementById('cmd-obs').value = '';

  document.getElementById('cmd-items-body').innerHTML = '';
  addItemRow();
  updateDescriptorPreview();
  recalcTotals();
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
      updateDescriptorPreview();
    }
  }
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
};

window.addItemRow = function(prefill = {}) {
  const tbody = document.getElementById('cmd-items-body');
  const tr = document.createElement('tr');
  tr.className = 'item-row';
  tr.innerHTML = `
    <td class="py-2 pr-2">
      <input type="text" list="lista-productos" placeholder="Escribe o elige producto..." class="input-field !py-1.5 text-xs item-txt" value="${prefill.txt || ''}" />
    </td>
    <td class="py-2 px-2">
      <select class="input-field !py-1.5 text-xs item-ume">
        <option value="un" ${(prefill.ume || 'un') === 'un' ? 'selected' : ''}>un</option>
        <option value="punit" ${prefill.ume === 'punit' ? 'selected' : ''}>punit</option>
        <option value="kg" ${prefill.ume === 'kg' ? 'selected' : ''}>kg</option>
        <option value="g" ${prefill.ume === 'g' ? 'selected' : ''}>g</option>
      </select>
    </td>
    <td class="py-2 px-2">
      <input type="number" step="any" min="0" class="input-field !py-1.5 text-xs item-pxq" value="${prefill.pxq ?? 0}" />
    </td>
    <td class="py-2 px-2">
      <input type="number" step="any" min="0" class="input-field !py-1.5 text-xs item-qty" value="${prefill.qty ?? 1}" />
    </td>
    <td class="py-2 px-2 text-right font-mono text-slate-600 item-neto">$0</td>
    <td class="py-2 px-2 text-right font-bold text-slate-900 item-redondeo">$0</td>
    <td class="py-2 pl-2 text-right">
      <button type="button" class="text-rose-500 hover:text-rose-700 font-bold text-base btn-del-row">&times;</button>
    </td>
  `;

  const txtInput = tr.querySelector('.item-txt');
  const umeInput = tr.querySelector('.item-ume');
  const pxqInput = tr.querySelector('.item-pxq');
  const qtyInput = tr.querySelector('.item-qty');

  txtInput.addEventListener('input', () => {
    const prod = state.productos.find(p => p.nombre.toLowerCase() === txtInput.value.trim().toLowerCase());
    if (prod) {
      pxqInput.value = prod.pxq;
      umeInput.value = prod.ume;
      recalcTotals();
    }
  });

  [pxqInput, qtyInput, umeInput].forEach(el => el.addEventListener('input', recalcTotals));
  tr.querySelector('.btn-del-row').addEventListener('click', () => {
    tr.remove();
    recalcTotals();
  });

  tbody.appendChild(tr);
  recalcTotals();
};

function recalcTotals() {
  const rows = document.querySelectorAll('#cmd-items-body .item-row');
  let sumValor = 0;
  let sumRedondeo = 0;

  rows.forEach(tr => {
    const pxq = Number(tr.querySelector('.item-pxq').value) || 0;
    const qty = Number(tr.querySelector('.item-qty').value) || 0;
    const neto = calcNetoUnit(pxq);
    const valor = pxq * qty;
    const red = roundToHundred(valor);

    tr.querySelector('.item-neto').textContent = formatCLP(neto);
    tr.querySelector('.item-redondeo').textContent = formatCLP(red);

    sumValor += valor;
    sumRedondeo += red;
  });

  const netoTotal = sumRedondeo / 1.19;
  const ivaTotal = sumRedondeo - netoTotal;

  document.getElementById('sum-items').textContent = rows.length;
  document.getElementById('sum-neto').textContent = formatCLP(netoTotal);
  document.getElementById('sum-iva').textContent = formatCLP(ivaTotal);
  document.getElementById('sum-valor').textContent = formatCLP(sumValor);
  document.getElementById('sum-redondeo').textContent = formatCLP(sumRedondeo);
}

window.saveComanda = async function() {
  const oc = document.getElementById('cmd-oc').value.trim().toUpperCase();
  const cliente = document.getElementById('cmd-cliente').value.trim();
  const fechaPedido = document.getElementById('cmd-fecha-pedido').value;
  const fechaEntrega = document.getElementById('cmd-fecha-entrega').value;
  const hora = document.getElementById('cmd-eta-hora').value;

  if (!oc || !cliente || !fechaEntrega) {
    showToast('Completa OC, Cliente y Fecha de entrega.', true);
    return;
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
      redondeo: roundToHundred(valor)
    };
  }).filter(it => it.txt !== '');

  if (items.length === 0) {
    showToast('Agrega al menos un producto a la comanda.', true);
    return;
  }

  const matchNum = oc.match(/(\d+)$/);
  const numeroCorrelativo = matchNum ? parseInt(matchNum[1], 10) : getNextCorrelativo();
  const rsIdVal = document.getElementById('cmd-razon-social').value;
  const tipoServicio = document.getElementById('cmd-tipo-servicio').value;
  const obs = document.getElementById('cmd-obs').value.trim();
  const hrsEntrega = hora ? `ETA ${hora} HRS` : '';
  const textoFecha = formatTextoFecha(fechaEntrega);
  const descriptorServicio = `${tipoServicio} ${textoFecha} ${oc} ${obs} ${hrsEntrega}`.replace(/\s+/g, ' ').trim();

  const totalValor = items.reduce((s, i) => s + i.valor, 0);
  const totalRedondeado = items.reduce((s, i) => s + i.redondeo, 0);

  const nuevaComanda = {
    id: Date.now(),
    numero_correlativo: numeroCorrelativo,
    oc,
    fecha_pedido: fechaPedido,
    hora_pedido: new Date().toTimeString().slice(0, 5),
    cliente_nombre: cliente,
    razon_social_id: rsIdVal ? parseInt(rsIdVal, 10) : null,
    tip_serv: document.getElementById('cmd-tip-serv').value,
    tipo_servicio: tipoServicio,
    fecha_entrega: fechaEntrega,
    hrs_entrega: hrsEntrega,
    obs,
    texto_fecha: textoFecha,
    descriptor_servicio: descriptorServicio,
    tipo_documento: document.getElementById('cmd-tipo-doc').value,
    estado_produccion: 'Agendado',
    emision_dte: 'Pendiente',
    dte: null,
    estado_pago: 'Pendiente',
    total_valor: totalValor,
    total_redondeado: totalRedondeado,
    items
  };

  if (state.isOnline && state.supabase) {
    try {
      const { items: cmdItems, id: _omit, ...cabecera } = nuevaComanda;
      const { data: inserted, error } = await state.supabase
        .from('comandas')
        .insert(cabecera)
        .select()
        .single();
      if (error) throw error;

      const itemsToInsert = cmdItems.map(it => ({ ...it, comanda_id: inserted.id }));
      const { error: itemsErr } = await state.supabase.from('comanda_items').insert(itemsToInsert);
      if (itemsErr) throw itemsErr;

      nuevaComanda.id = inserted.id;
    } catch (err) {
      console.error(err);
      showToast('Error al guardar en Supabase: ' + err.message, true);
      return;
    }
  }

  state.comandas.unshift(nuevaComanda);
  saveLocal();
  showToast(`Comanda ${oc} guardada y agendada.`);
  resetComandaForm();
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

  // Ordenar por fecha_entrega asc y luego ETA
  list.sort((a, b) => {
    if (a.fecha_entrega !== b.fecha_entrega) return (a.fecha_entrega || '').localeCompare(b.fecha_entrega || '');
    return (a.hrs_entrega || '').localeCompare(b.hrs_entrega || '');
  });

  if (list.length === 0) {
    container.innerHTML = `<div class="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">No hay comandas agendadas con ese filtro.</div>`;
    return;
  }

  // Agrupar por fecha_entrega
  const groups = {};
  list.forEach(c => {
    const key = c.fecha_entrega || 'Sin fecha';
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  });

  container.innerHTML = Object.entries(groups).map(([fecha, cmds]) => {
    const titulo = fecha !== 'Sin fecha' ? formatTextoFecha(fecha) : 'Sin fecha';
    return `
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <span class="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold capitalize">${titulo}</span>
          <span class="text-xs text-slate-500">(${cmds.length} ${cmds.length === 1 ? 'pedido' : 'pedidos'})</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${cmds.map(c => renderAgendaCard(c)).join('')}
        </div>
      </div>
    `;
  }).join('');
};

function renderAgendaCard(c) {
  const isUrgente = c.tipo_servicio === 'Servicio urgente';
  const itemsHtml = (c.items || []).map(i => `
    <li class="flex justify-between text-xs py-0.5">
      <span class="text-slate-700"><strong>${i.ume === 'kg' || i.ume === 'g' ? i.peso + ' ' + i.ume : i.qty}</strong> × ${i.txt}</span>
      <span class="text-slate-500 font-mono">${formatCLP(i.redondeo)}</span>
    </li>
  `).join('');

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
        <div class="text-xs text-slate-600 mb-2">${c.obs || 'Sin observaciones de lugar'}</div>

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
          <button onclick="printComanda(${c.id})" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">
            Ticket
          </button>
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
    </div>
    <table class="w-full text-xs border-t border-b border-slate-200 my-2">
      <thead><tr class="text-left border-b"><th class="py-1">Cant</th><th>Descripción</th><th class="text-right">Total</th></tr></thead>
      <tbody>
        ${(c.items || []).map(i => `
          <tr>
            <td class="py-1 font-bold">${i.ume === 'kg' || i.ume === 'g' ? i.peso + i.ume : i.qty}</td>
            <td>${i.txt}</td>
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
// HISTORIAL, DTE, PAGOS Y EXPORTACIÓN CSV
// ============================================================================
window.renderHistorial = function() {
  // 1. Resumen de deuda por Razón Social
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

  // 2. Tabla de Comandas
  const search = document.getElementById('hist-search').value.trim().toLowerCase();
  const tbody = document.getElementById('historial-body');
  const filtered = state.comandas.filter(c => {
    if (!search) return true;
    const rs = state.razonesSociales.find(r => r.id === c.razon_social_id);
    const txt = `${c.oc} ${c.dte || ''} ${c.cliente_nombre} ${rs?.razon_social || ''}`.toLowerCase();
    return txt.includes(search);
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
        <td class="py-2.5 pl-2 text-right">
          <button onclick="printComanda(${c.id})" class="text-xs font-semibold text-slate-600 hover:text-slate-900 underline">Ver</button>
        </td>
      </tr>
    `;
  }).join('');
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
// CATÁLOGO Y CLIENTES
// ============================================================================
function renderCatalogo() {
  const prodList = document.getElementById('catalogo-productos-list');
  prodList.innerHTML = state.productos.map(p => `
    <div class="py-2 flex justify-between items-center">
      <div>
        <div class="font-semibold text-slate-900">${p.nombre}</div>
        <div class="text-[11px] text-slate-500">${p.categoria || 'General'} • ${p.ume}</div>
      </div>
      <div class="font-bold text-amber-700">${formatCLP(p.pxq)}</div>
    </div>
  `).join('');

  const contList = document.getElementById('catalogo-contactos-list');
  contList.innerHTML = state.contactos.map(c => {
    const rs = state.razonesSociales.find(r => r.id === c.razon_social_id);
    return `
      <div class="py-2 flex justify-between items-center">
        <div>
          <div class="font-semibold text-slate-900">${c.nombre}</div>
          <div class="text-[11px] text-slate-500">${rs ? rs.razon_social : 'Particular'} • ${c.destino_habitual || '-'}</div>
        </div>
      </div>
    `;
  }).join('');
}

window.addProducto = async function() {
  const nombre = document.getElementById('new-prod-nombre').value.trim();
  const pxq = Number(document.getElementById('new-prod-pxq').value) || 0;
  const ume = document.getElementById('new-prod-ume').value;
  if (!nombre) return;

  const prod = { id: Date.now(), nombre, pxq, ume, categoria: 'Personalizado' };
  if (state.isOnline && state.supabase) {
    const { id: _omit, ...payload } = prod;
    const { data, error } = await state.supabase.from('productos').insert(payload).select().single();
    if (error) return showToast(error.message, true);
    prod.id = data.id;
  }

  state.productos.push(prod);
  saveLocal();
  populateSelects();
  renderCatalogo();
  document.getElementById('new-prod-nombre').value = '';
  document.getElementById('new-prod-pxq').value = '';
  showToast('Producto agregado al catálogo.');
};

window.addContacto = async function() {
  const nombre = document.getElementById('new-cont-nombre').value.trim();
  const rsVal = document.getElementById('new-cont-rs').value;
  const destino = document.getElementById('new-cont-destino').value.trim();
  if (!nombre) return;

  const cont = {
    id: Date.now(),
    nombre,
    razon_social_id: rsVal ? parseInt(rsVal, 10) : null,
    destino_habitual: destino,
    despacho_habitual: 0
  };
  if (state.isOnline && state.supabase) {
    const { id: _omit, ...payload } = cont;
    const { data, error } = await state.supabase.from('contactos').insert(payload).select().single();
    if (error) return showToast(error.message, true);
    cont.id = data.id;
  }

  state.contactos.push(cont);
  saveLocal();
  populateSelects();
  renderCatalogo();
  document.getElementById('new-cont-nombre').value = '';
  document.getElementById('new-cont-destino').value = '';
  showToast('Contacto guardado.');
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
  const valorKm = (bencina / kml) * 1.2; // factor mantención/desgaste similar a tu hoja (130 -> 156)
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
  if (!url || !key) {
    showToast('Ingresa ambos campos de Supabase.', true);
    return;
  }

  localStorage.setItem(STORAGE_KEYS.SB_URL, url);
  localStorage.setItem(STORAGE_KEYS.SB_KEY, key);

  try {
    state.supabase = window.supabase.createClient(url, key);
    await loadFromSupabase();
    setConnectionBadge(true);
    populateSelects();
    resetComandaForm();
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
  if (!state.supabase) {
    showToast('Primero guarda y conecta tu URL y Key de Supabase.', true);
    return;
  }
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

window.disconnectSupabase = function() {
  localStorage.removeItem(STORAGE_KEYS.SB_URL);
  localStorage.removeItem(STORAGE_KEYS.SB_KEY);
  state.supabase = null;
  loadFromLocal();
  setConnectionBadge(false);
  populateSelects();
  resetComandaForm();
  renderAgenda();
  renderHistorial();
  renderCatalogo();
  showToast('Modo Local activado.');
};

init();
