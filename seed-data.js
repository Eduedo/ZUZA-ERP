// Datos maestros e historial reciente extraídos de la data real de ERP ZUZA
// Último correlativo registrado: ZRA-290 (DTE 167) -> Siguiente automático: ZRA-291

export const SEED_USUARIOS = [
  { id: 1, nombre: 'Francisca González', pin: '1234', rol: 'Admin', activo: true },
  { id: 2, nombre: 'José Tomás Miranda', pin: '1234', rol: 'Ventas', activo: true },
  { id: 3, nombre: 'Pablo Díaz', pin: '1234', rol: 'Ventas', activo: true },
  { id: 4, nombre: 'Producción', pin: '1234', rol: 'Producción', activo: true }
];

export const SEED_RAZONES_SOCIALES = [
  { id: 10, rut: '71014200-9', razon_social: 'CORP MUNICIPAL DE SERVICIOS PUBLICOS', contacto_principal: 'MARJORIE RUZ' },
  { id: 11, rut: '61606800-8', razon_social: 'SERVICIO DE SALUD LIBERTADOR BDO OHIGGINS', contacto_principal: 'Denisse Poblete' },
  { id: 12, rut: '69080300-3', razon_social: 'I MUNICIPALIDAD DE GRANEROS', contacto_principal: 'Bárbara Donoso' },
  { id: 13, rut: '77482082-5', razon_social: 'Casona Monetta SPA', contacto_principal: 'Francisca Gonzales' },
  { id: 14, rut: '', razon_social: 'Cuerpo de bomberos de Rancagua', contacto_principal: '' },
  { id: 15, rut: '77932814-7', razon_social: 'Óptymus group ktda', contacto_principal: 'Francisco Muñoz' }
];

export const SEED_CONTACTOS = [
  { id: 1, nombre: 'Francisca González', razon_social_id: 13, destino_habitual: 'Entrega country Monetta', despacho_habitual: 7000 },
  { id: 2, nombre: 'José Tomás Miranda', razon_social_id: 13, destino_habitual: 'Entrega country Monetta', despacho_habitual: 7000 },
  { id: 3, nombre: 'Pablo Díaz', razon_social_id: 13, destino_habitual: 'Entrega Country Monetta', despacho_habitual: 7000 },
  { id: 4, nombre: 'Francisco Muñoz', razon_social_id: 15, destino_habitual: 'Entrega local', despacho_habitual: 0 },
  { id: 5, nombre: 'Marjorie Ruz', razon_social_id: 10, destino_habitual: 'Suministro LIC. J.V. LASTARRIA', despacho_habitual: 0 },
  { id: 6, nombre: 'Rocio Paillacar', razon_social_id: null, destino_habitual: 'Entrega Local', despacho_habitual: 2000 },
  { id: 7, nombre: 'Diego Garay', razon_social_id: null, destino_habitual: 'Despacho Machalí', despacho_habitual: 3000 },
  { id: 8, nombre: 'Bomberos Rancagua', razon_social_id: 14, destino_habitual: 'Rancagua', despacho_habitual: 0 }
];

export const SEED_PRODUCTOS = [
  { id: 1, nombre: 'Pastelillos cóctel', pxq: 300, ume: 'un', categoria: 'Cóctel', activo: true },
  { id: 2, nombre: 'Sopaipillas cóctel', pxq: 185, ume: 'un', categoria: 'Cóctel', activo: true },
  { id: 3, nombre: 'Mini Galletas artesanales', pxq: 220, ume: 'un', categoria: 'Cóctel', activo: true },
  { id: 4, nombre: 'Galletas artesanales', pxq: 290, ume: 'un', categoria: 'Cóctel', activo: true },
  { id: 5, nombre: 'Empanada pino', pxq: 2800, ume: 'un', categoria: 'Empanadas', activo: true },
  { id: 6, nombre: 'Empanada Queso', pxq: 2500, ume: 'un', categoria: 'Empanadas', activo: true },
  { id: 7, nombre: 'Empanada Vegana', pxq: 2800, ume: 'un', categoria: 'Empanadas', activo: true },
  { id: 8, nombre: 'Chileno', pxq: 1400, ume: 'un', categoria: 'Dulces', activo: true },
  { id: 9, nombre: 'Biscuit', pxq: 290, ume: 'un', categoria: 'Cóctel', activo: true },
  { id: 10, nombre: 'Delicias 5cm', pxq: 360, ume: 'punit', categoria: 'Cóctel', activo: true },
  { id: 11, nombre: 'Queque', pxq: 6500, ume: 'un', categoria: 'Pastelería', activo: true },
  { id: 12, nombre: 'mini tartaletas', pxq: 300, ume: 'un', categoria: 'Cóctel', activo: true },
  { id: 13, nombre: 'Cup cakes', pxq: 1600, ume: 'un', categoria: 'Cóctel', activo: true },
  { id: 14, nombre: 'Pop Cakes', pxq: 1500, ume: 'un', categoria: 'Cóctel', activo: true },
  { id: 15, nombre: 'Galleta diseños', pxq: 1700, ume: 'un', categoria: 'Cóctel', activo: true },
  { id: 16, nombre: 'Kuchen manzana', pxq: 14000, ume: 'un', categoria: 'Kuchen', activo: true },
  { id: 17, nombre: 'Kuchen nuez', pxq: 19950, ume: 'un', categoria: 'Kuchen', activo: true },
  { id: 18, nombre: 'Pompadour Plátano 30p', pxq: 35000, ume: 'un', categoria: 'Tortas 30p', activo: true },
  { id: 19, nombre: 'Pompadour Frambuesa 30p', pxq: 42000, ume: 'un', categoria: 'Tortas 30p', activo: true },
  { id: 20, nombre: 'Pompadour plátano 40p', pxq: 41000, ume: 'un', categoria: 'Tortas 40p', activo: true },
  { id: 21, nombre: 'Pompadour plátano 50p', pxq: 53000, ume: 'un', categoria: 'Tortas 50p', activo: true },
  { id: 22, nombre: 'pompadour Frambuesa 50p', pxq: 55000, ume: 'un', categoria: 'Tortas 50p', activo: true },
  { id: 23, nombre: 'Pompadour Plátano 60p', pxq: 53000, ume: 'un', categoria: 'Tortas 60p', activo: true },
  { id: 24, nombre: 'Turrón nuez 30p', pxq: 39000, ume: 'un', categoria: 'Tortas 30p', activo: true },
  { id: 25, nombre: 'Mil Hojas 30p', pxq: 37000, ume: 'un', categoria: 'Tortas 30p', activo: true },
  { id: 26, nombre: 'Mil Hojas 40p', pxq: 39000, ume: 'un', categoria: 'Tortas 40p', activo: true },
  { id: 27, nombre: 'Mil hojas Frambuesa Natural', pxq: 64000, ume: 'un', categoria: 'Tortas Especiales', activo: true },
  { id: 28, nombre: 'Bizcocho manjar crema piña 30p', pxq: 38000, ume: 'un', categoria: 'Tortas 30p', activo: true },
  { id: 29, nombre: 'Bizcocho manjar crema piña 50p', pxq: 52000, ume: 'un', categoria: 'Tortas 50p', activo: true },
  { id: 30, nombre: 'Selva negra 30p', pxq: 35000, ume: 'un', categoria: 'Tortas 30p', activo: true },
  { id: 31, nombre: 'Torta selvanegra 40p', pxq: 42000, ume: 'un', categoria: 'Tortas 40p', activo: true },
  { id: 32, nombre: 'Tres leches 30p', pxq: 41000, ume: 'un', categoria: 'Tortas 30p', activo: true },
  { id: 33, nombre: 'Panqueque Chocolate 30p', pxq: 44000, ume: 'un', categoria: 'Tortas 30p', activo: true },
  { id: 34, nombre: 'Panqueque Naranja 30p', pxq: 35000, ume: 'un', categoria: 'Tortas 30p', activo: true },
  { id: 35, nombre: 'Manjar durazno 20p', pxq: 35000, ume: 'un', categoria: 'Tortas 20p', activo: true },
  { id: 36, nombre: 'Manjar durazno 40p', pxq: 43000, ume: 'un', categoria: 'Tortas 40p', activo: true },
  { id: 37, nombre: 'Francisca extra 40p', pxq: 63000, ume: 'un', categoria: 'Tortas 40p', activo: true },
  { id: 38, nombre: 'Torta helada Frambuesa trozo', pxq: 9400, ume: 'kg', categoria: 'Trozos', activo: true },
  { id: 39, nombre: 'Despacho', pxq: 7000, ume: 'un', categoria: 'Despacho', activo: true },
  { id: 40, nombre: 'Despacho Mostazal', pxq: 6000, ume: 'un', categoria: 'Despacho', activo: true },
  { id: 41, nombre: 'Despacho Alto Ohiggins', pxq: 2000, ume: 'un', categoria: 'Despacho', activo: true }
];

// Comandas recientes reales (ZRA-285 a ZRA-290) para continuar la secuencia desde ZRA-291
export const SEED_COMANDAS = [
  {
    id: 290,
    numero_correlativo: 290,
    oc: 'ZRA-290',
    fecha_pedido: '2026-11-24',
    hora_pedido: '',
    cliente_nombre: 'José Tomás Miranda',
    razon_social_id: 13,
    tip_serv: '',
    tipo_servicio: 'Servicio',
    fecha_entrega: '2026-11-25',
    hrs_entrega: 'ETA 21:30 HRS',
    obs: 'Alto Ohiggins',
    texto_fecha: 'miércoles 25 de noviembre',
    descriptor_servicio: 'Servicio miércoles 25 de noviembre ZRA-290 Alto Ohiggins ETA 21:30 HRS',
    tipo_documento: 'Factura',
    estado_produccion: 'Entregado',
    emision_dte: 'Pendiente',
    dte: 167,
    estado_pago: 'Pendiente',
    total_valor: 55560,
    total_redondeado: 55600,
    items: [
      { linea: 1, txt: 'Despacho', pxq: 2000, ume: 'un', qty: 1, neto: 1680.67, peso: 0, valor: 2000, redondeo: 2000 },
      { linea: 2, txt: 'Pastelillos cóctel', pxq: 300, ume: 'un', qty: 56, neto: 252.10, peso: 0, valor: 16800, redondeo: 16800 },
      { linea: 3, txt: 'Sopaipillas cóctel', pxq: 185, ume: 'un', qty: 56, neto: 155.46, peso: 0, valor: 10360, redondeo: 10400 },
      { linea: 4, txt: 'Mini Galletas artesanales', pxq: 220, ume: 'un', qty: 120, neto: 184.87, peso: 0, valor: 26400, redondeo: 26400 }
    ]
  },
  {
    id: 289,
    numero_correlativo: 289,
    oc: 'ZRA-289',
    fecha_pedido: '2026-11-23',
    hora_pedido: '',
    cliente_nombre: 'Francisca González',
    razon_social_id: 13,
    tip_serv: '',
    tipo_servicio: 'Servicio',
    fecha_entrega: '2026-11-24',
    hrs_entrega: 'ETA 9:30 HRS',
    obs: 'Entrega Centro cultural Estación Mostazal',
    texto_fecha: 'martes 24 de noviembre',
    descriptor_servicio: 'Servicio martes 24 de noviembre ZRA-289 Entrega Centro cultural Estación Mostazal ETA 9:30 HRS',
    tipo_documento: 'Factura',
    estado_produccion: 'Entregado',
    emision_dte: 'Pendiente',
    dte: 166,
    estado_pago: 'Pendiente',
    total_valor: 81000,
    total_redondeado: 81000,
    items: [
      { linea: 1, txt: 'Despacho', pxq: 6000, ume: 'un', qty: 1, neto: 5042.02, peso: 0, valor: 6000, redondeo: 6000 },
      { linea: 2, txt: 'Pastelillos cóctel', pxq: 300, ume: 'un', qty: 250, neto: 252.10, peso: 0, valor: 75000, redondeo: 75000 }
    ]
  },
  {
    id: 288,
    numero_correlativo: 288,
    oc: 'ZRA-288',
    fecha_pedido: '2026-11-21',
    hora_pedido: '',
    cliente_nombre: 'Francisca González',
    razon_social_id: 13,
    tip_serv: '',
    tipo_servicio: 'Servicio',
    fecha_entrega: '2026-11-22',
    hrs_entrega: 'ETA 12:00 HRS',
    obs: 'Entrega country Monetta',
    texto_fecha: 'domingo 22 de noviembre',
    descriptor_servicio: 'Servicio domingo 22 de noviembre ZRA-288 Entrega country Monetta ETA 12:00 HRS',
    tipo_documento: 'Factura',
    estado_produccion: 'Entregado',
    emision_dte: 'Pendiente',
    dte: 165,
    estado_pago: 'Pendiente',
    total_valor: 42000,
    total_redondeado: 42000,
    items: [
      { linea: 1, txt: 'Despacho', pxq: 7000, ume: 'un', qty: 1, neto: 5882.35, peso: 0, valor: 7000, redondeo: 7000 },
      { linea: 2, txt: 'Manjar durazno 20p', pxq: 35000, ume: 'un', qty: 1, neto: 29411.76, peso: 0, valor: 35000, redondeo: 35000 }
    ]
  },
  {
    id: 287,
    numero_correlativo: 287,
    oc: 'ZRA-287',
    fecha_pedido: '2026-11-20',
    hora_pedido: '',
    cliente_nombre: 'Francisca González',
    razon_social_id: 13,
    tip_serv: '',
    tipo_servicio: 'Servicio',
    fecha_entrega: '2026-11-21',
    hrs_entrega: 'ETA 15:00 HRS',
    obs: 'Entrega country Monetta',
    texto_fecha: 'sábado 21 de noviembre',
    descriptor_servicio: 'Servicio sábado 21 de noviembre ZRA-287 Entrega country Monetta ETA 15:00 HRS',
    tipo_documento: 'Factura',
    estado_produccion: 'Entregado',
    emision_dte: 'Pendiente',
    dte: 164,
    estado_pago: 'Pendiente',
    total_valor: 257400,
    total_redondeado: 257400,
    items: [
      { linea: 1, txt: 'Pastelillos cóctel', pxq: 300, ume: 'un', qty: 400, neto: 252.10, peso: 0, valor: 120000, redondeo: 120000 },
      { linea: 2, txt: 'Francisca extra 40p', pxq: 63000, ume: 'un', qty: 1, neto: 52941.18, peso: 0, valor: 63000, redondeo: 63000 },
      { linea: 3, txt: 'Cup cakes', pxq: 1600, ume: 'un', qty: 24, neto: 1344.54, peso: 0, valor: 38400, redondeo: 38400 },
      { linea: 4, txt: 'Pop Cakes', pxq: 1500, ume: 'un', qty: 24, neto: 1260.50, peso: 0, valor: 36000, redondeo: 36000 }
    ]
  },
  {
    id: 286,
    numero_correlativo: 286,
    oc: 'ZRA-286',
    fecha_pedido: '2026-11-17',
    hora_pedido: '',
    cliente_nombre: 'José Tomás Miranda',
    razon_social_id: 13,
    tip_serv: '',
    tipo_servicio: 'Servicio',
    fecha_entrega: '2026-11-21',
    hrs_entrega: 'ETA 15:00 HRS',
    obs: 'Entrega country Monetta',
    texto_fecha: 'sábado 21 de noviembre',
    descriptor_servicio: 'Servicio sábado 21 de noviembre ZRA-286 Entrega country Monetta ETA 15:00 HRS',
    tipo_documento: 'Factura',
    estado_produccion: 'Entregado',
    emision_dte: 'Pendiente',
    dte: 163,
    estado_pago: 'Pendiente',
    total_valor: 91600,
    total_redondeado: 91600,
    items: [
      { linea: 1, txt: 'Despacho', pxq: 7000, ume: 'un', qty: 1, neto: 5882.35, peso: 0, valor: 7000, redondeo: 7000 },
      { linea: 2, txt: 'Sopaipillas cóctel', pxq: 185, ume: 'un', qty: 120, neto: 155.46, peso: 0, valor: 22200, redondeo: 22200 },
      { linea: 3, txt: 'Pastelillos cóctel', pxq: 300, ume: 'un', qty: 120, neto: 252.10, peso: 0, valor: 36000, redondeo: 36000 },
      { linea: 4, txt: 'Mini Galletas artesanales', pxq: 220, ume: 'un', qty: 120, neto: 184.87, peso: 0, valor: 26400, redondeo: 26400 }
    ]
  }
];
