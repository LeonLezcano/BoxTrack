/**
 * BoxTrack - Main Application Orchestrator
 * Integracion de Cubaje Forense, Rotulos QR, Actas Pre-Dano,
 * Mudanzas Corporativas y Guardamuebles con Sello SHA-256.
 */

import { VolumeCalculator, VEHICLE_FLEET } from './core/volumeCalculator.js';
import { DamagePreInspectionEngine } from './core/damagePreInspectionEngine.js';
import { STORAGE_UNITS_CATALOG } from './core/storageDunningSentinel.js';
import { MoveOrderService } from './services/moveOrderService.js';
import { StorageContractService } from './services/storageContractService.js';
import { ExportService } from './services/exportService.js';
import { BoxTrackCacheService } from './services/boxTrackCache.service.js';
import { WhatsAppBoxNotifierService } from './services/whatsAppBoxNotifier.service.js';
import { Sanitizer } from './utils/sanitizer.js';
import { Formatters } from './utils/formatters.js';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

const SVG_ICONS = {
  pin: '<svg class="w-3.5 h-3.5 shrink-0 text-[#9aa4b5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  flag: '<svg class="w-3.5 h-3.5 shrink-0 text-[#9aa4b5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>',
  lock: '<svg class="w-3.5 h-3.5 shrink-0 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  message: '<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  check: '<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
  box: '<svg class="w-4 h-4 shrink-0 text-[#fbbf24]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
  clock: '<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  camera: '<svg class="w-5 h-5 shrink-0 text-[#9aa4b5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
  shieldAlert: '<svg class="w-4 h-4 shrink-0 text-rose-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="4.93" x2="19.07" y1="4.93" y2="19.07"/></svg>',
  key: '<svg class="w-4 h-4 shrink-0 text-[#38bdf8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>'
};

class BoxTrackApp {
  constructor() {
    this.orders = [];
    this.damages = [];
    this.contracts = [];
    this.activeTab = 'moves';
    this.selectedOrderId = null;
    this.estimatorExpanded = true;
    this.lastModalTrigger = null;
    this.epodState = { orderId: null, mode: 'origin' };
  }

  init() {
    this.loadOrSeedData();
    this.bindEvents();
    this.updateNetworkStatus();
    this.updateVolumeEstimator();
    this.switchTab(this.activeTab);
  }

  loadOrSeedData() {
    if (BoxTrackCacheService.isPurged()) {
      this.orders = [];
      this.damages = [];
      this.contracts = [];
      this.selectedOrderId = null;
      return;
    }

    const savedOrders = BoxTrackCacheService.getOrders();
    const savedDamages = BoxTrackCacheService.getDamages();
    const savedContracts = BoxTrackCacheService.getContracts();

    if (savedOrders.length > 0 || savedDamages.length > 0 || savedContracts.length > 0) {
      this.orders = savedOrders;
      this.damages = savedDamages;
      this.contracts = savedContracts.map((c) => StorageContractService.evaluateContractStatus(c));
      this.selectedOrderId = this.orders[0]?.orderId || null;
      return;
    }

    this.seedInitialDemoData();
    this.persistState();
  }

  persistState() {
    if (BoxTrackCacheService.isPurged()) {
      return;
    }
    BoxTrackCacheService.saveOrders(this.orders);
    BoxTrackCacheService.saveDamages(this.damages);
    BoxTrackCacheService.saveContracts(this.contracts);
  }

  hasDemoData() {
    return (
      this.orders.some((o) => o.isDemo) ||
      this.damages.some((d) => d.isDemo) ||
      this.contracts.some((c) => c.isDemo)
    );
  }

  seedInitialDemoData() {
    if (BoxTrackCacheService.isPurged()) {
      return;
    }

    const damageSample = DamagePreInspectionEngine.recordPreExistingDamage({
      itemTag: 'ESCRIT-ROBLE-01',
      itemName: 'Escritorio Gerencial Roble [DEMO]',
      damageType: 'SURFACE_SCRATCH',
      locationOnItem: 'Tapa superior extremo derecho',
      description: 'Rayón en tapa de 12 cm registrado como ejemplo de demostración',
      photoWitnessUrl: '',
      isFragile: false
    });
    damageSample.isDemo = true;
    this.damages.push(damageSample);

    const demoItems = [
      { name: 'Smart TV 75" Sala Reuniones', type: 'SMART_TV_65', quantity: 1, room: 'Directorio', isFragile: true },
      { name: 'Cajas Archivo y Documentación', type: 'BOX_STANDARD', quantity: 25, room: 'Administración', isFragile: false },
      { name: 'Puesto de Trabajo Gerencial', type: 'OFFICE_DESK', quantity: 2, room: 'Gerencia', isFragile: false },
      { name: 'Sillones Ergonómicos Mesh', type: 'SOFA_3_SEATS', quantity: 1, room: 'Recepción', isFragile: false }
    ];

    const order = MoveOrderService.createOrder({
      customerId: 'CLI-DEMO-401',
      customerName: 'Finanzas Globales S.A. [DEMO]',
      customerPhone: '+5491133334444',
      originAddress: 'Av. Leandro N. Alem 850 Piso 12, CABA',
      destinationAddress: 'Av. del Libertador 6250 Piso 3, CABA',
      scheduledDate: new Date().toISOString().split('T')[0],
      items: demoItems,
      damages: [damageSample],
      pricing: { totalAmount: 380000, depositPaid: 150000 }
    });
    order.isDemo = true;

    this.orders.push(order);
    this.selectedOrderId = order.orderId;

    const c1 = StorageContractService.createContract({
      unitCode: 'BOX-A-12',
      unitType: 'MEDIUM_15',
      customerId: 'CLI-DEMO-11',
      customerName: 'Estudio Jurídico Albarracín [DEMO]',
      customerPhone: '+5491188889999',
      monthlyFeeArs: 85000,
      dueDayOfMonth: 28
    });
    c1.isDemo = true;

    const c2 = StorageContractService.createContract({
      unitCode: 'BOX-B-04',
      unitType: 'LARGE_30',
      customerId: 'CLI-DEMO-22',
      customerName: 'Constructora del Plata SRL [DEMO]',
      customerPhone: '+5491122223333',
      monthlyFeeArs: 140000,
      dueDayOfMonth: 5
    });
    const past8 = new Date();
    past8.setDate(past8.getDate() - 8);
    c2.nextDueDate = past8.toISOString();
    c2.currentDunning = StorageContractService.evaluateContractStatus(c2).currentDunning;
    c2.isDemo = true;

    const c3 = StorageContractService.createContract({
      unitCode: 'BOX-C-09',
      unitType: 'CONTAINER_75',
      customerId: 'CLI-DEMO-33',
      customerName: 'Distribuidora San Martín [DEMO]',
      customerPhone: '+5491177778888',
      monthlyFeeArs: 220000,
      dueDayOfMonth: 1
    });
    const past25 = new Date();
    past25.setDate(past25.getDate() - 25);
    c3.nextDueDate = past25.toISOString();
    c3.currentDunning = StorageContractService.evaluateContractStatus(c3).currentDunning;
    c3.isDemo = true;

    this.contracts.push(c1, c2, c3);
  }

  bindEvents() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-tab');
        if (target) this.switchTab(target);
      });
    });

    // Connectivity
    window.addEventListener('online', () => {
      this.updateNetworkStatus();
      this.showToast('Conexión restablecida.', 'success');
    });
    window.addEventListener('offline', () => {
      this.updateNetworkStatus();
      this.showToast('Modo sin conexión activo. Los cambios quedan guardados localmente.', 'warning');
    });

    // Service Worker events
    window.addEventListener('boxtrack:sw-error', (e) => {
      this.showToast(e.detail?.message || 'No se pudo inicializar el caché offline.', 'error');
    });
    window.addEventListener('boxtrack:sw-update', () => {
      this.showToast('Nueva versión disponible en caché. Recargue la pestaña para actualizar.', 'info');
    });

    // Global Escape key closes active modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });

    // Print light-paper mode hooks
    window.addEventListener('beforeprint', () => {
      document.documentElement.classList.add('is-printing');
    });
    window.addEventListener('afterprint', () => {
      document.documentElement.classList.remove('is-printing');
    });

    // Estimator toggle
    const btnToggleEst = document.getElementById('btn-toggle-estimator');
    if (btnToggleEst) {
      btnToggleEst.addEventListener('click', () => this.toggleVolumeEstimator());
    }

    // Volume Estimator inputs
    ['inp-box-std', 'inp-desk', 'inp-chair', 'inp-rack', 'inp-monitor', 'inp-fridge'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.updateVolumeEstimator());
      }
    });

    const btnApply = document.getElementById('btn-apply-estimator-to-move');
    if (btnApply) {
      btnApply.addEventListener('click', (e) => this.openMoveModal(true, e.currentTarget));
    }

    // Move Modal
    const btnNewMove = document.getElementById('btn-new-move');
    if (btnNewMove) btnNewMove.addEventListener('click', (e) => this.openMoveModal(false, e.currentTarget));
    document.getElementById('btn-close-move-modal')?.addEventListener('click', () => this.closeModal('modal-new-move'));
    document.getElementById('btn-cancel-move')?.addEventListener('click', () => this.closeModal('modal-new-move'));
    document.getElementById('form-create-move')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateMove();
    });

    // Damage Modal
    document.getElementById('btn-add-damage-modal')?.addEventListener('click', (e) => this.openModal('modal-new-damage', e.currentTarget, 'inp-damage-item'));
    document.getElementById('btn-close-damage-modal')?.addEventListener('click', () => this.closeModal('modal-new-damage'));
    document.getElementById('btn-cancel-damage')?.addEventListener('click', () => this.closeModal('modal-new-damage'));
    document.getElementById('form-create-damage')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateDamage();
    });

    // Storage Modal
    document.getElementById('btn-new-storage-contract')?.addEventListener('click', (e) => {
      this.openModal('modal-new-storage', e.currentTarget, 'inp-storage-customer');
    });
    document.getElementById('btn-close-storage-modal')?.addEventListener('click', () => this.closeModal('modal-new-storage'));
    document.getElementById('btn-cancel-storage')?.addEventListener('click', () => this.closeModal('modal-new-storage'));
    document.getElementById('inp-storage-unit-type')?.addEventListener('change', (e) => {
      const spec = STORAGE_UNITS_CATALOG[e.target.value];
      const feeEl = document.getElementById('inp-storage-fee');
      if (spec && feeEl) feeEl.value = String(spec.monthlyFeeArs);
    });
    document.getElementById('form-create-storage')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateStorageContract();
    });

    // ePOD Modal
    document.getElementById('btn-close-epod-modal')?.addEventListener('click', () => this.closeModal('modal-epod-sign'));
    document.getElementById('btn-cancel-epod')?.addEventListener('click', () => this.closeModal('modal-epod-sign'));
    document.getElementById('form-epod-sign')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmitEpod();
    });

    // Purge Demo Modal
    document.getElementById('btn-purge-demo')?.addEventListener('click', (e) => this.openModal('modal-confirm-purge', e.currentTarget, 'btn-confirm-purge'));
    document.getElementById('btn-banner-purge-demo')?.addEventListener('click', (e) => this.openModal('modal-confirm-purge', e.currentTarget, 'btn-confirm-purge'));
    document.getElementById('btn-close-purge-modal')?.addEventListener('click', () => this.closeModal('modal-confirm-purge'));
    document.getElementById('btn-cancel-purge')?.addEventListener('click', () => this.closeModal('modal-confirm-purge'));
    document.getElementById('btn-confirm-purge')?.addEventListener('click', () => this.handlePurgeDemo());

    // Inventory selector & print
    const selMove = document.getElementById('select-move-for-inventory');
    if (selMove) {
      selMove.addEventListener('change', (e) => {
        this.selectedOrderId = e.target.value || null;
        this.renderInventoryTable();
      });
    }

    document.getElementById('btn-print-bulto-tags')?.addEventListener('click', () => {
      if (!this.selectedOrderId) {
        this.showToast('Seleccione una mudanza antes de imprimir etiquetas.', 'warning');
        return;
      }
      window.print();
    });

    // Export CSV
    document.getElementById('btn-export-csv')?.addEventListener('click', () => {
      if (this.orders.length === 0) {
        this.showToast('No hay mudanzas registradas para exportar.', 'warning');
        return;
      }
      try {
        ExportService.downloadMovesCsv
          ? ExportService.downloadMovesCsv(this.orders)
          : ExportService.exportToExcelCSV(
              `boxtrack_mudanzas_${new Date().toISOString().slice(0, 10)}`,
              this.orders.map((o) => ({
                orderId: o.orderId,
                customerName: o.customerName,
                originAddress: o.originAddress,
                destinationAddress: o.destinationAddress,
                totalM3: o.volumeSummary?.totalM3 ?? 0,
                status: o.status,
                cryptoSeal: o.cryptoSeal || 'PENDIENTE'
              })),
              [
                { key: 'orderId', label: 'Orden' },
                { key: 'customerName', label: 'Cliente' },
                { key: 'originAddress', label: 'Origen' },
                { key: 'destinationAddress', label: 'Destino' },
                { key: 'totalM3', label: 'Volumen (m3)' },
                { key: 'status', label: 'Estado' },
                { key: 'cryptoSeal', label: 'Sello SHA-256' }
              ]
            );
        this.showToast(`Exportación CSV generada (${this.orders.length} órdenes).`, 'success');
      } catch (err) {
        this.showToast(err?.message || 'No se pudo generar el archivo CSV.', 'error');
      }
    });
  }

  updateNetworkStatus() {
    const badge = document.getElementById('network-badge');
    if (!badge) return;
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
    if (isOnline) {
      badge.textContent = 'EN LÍNEA';
      badge.className = 'text-xs font-mono px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-200 border border-emerald-700 font-bold';
    } else {
      badge.textContent = 'OFFLINE';
      badge.className = 'text-xs font-mono px-2.5 py-0.5 rounded bg-amber-950 text-amber-200 border border-amber-700 font-bold';
    }
  }

  showToast(message, type = 'info') {
    const region = document.getElementById('app-toast-region');
    if (!region) return;

    const palette = {
      success: 'bg-emerald-950 border-emerald-700 text-emerald-100',
      error: 'bg-rose-950 border-rose-700 text-rose-100',
      warning: 'bg-amber-950 border-amber-700 text-amber-100',
      info: 'bg-[#181b22] border-[#343b4c] text-[#f3f5f8]'
    }[type] || 'bg-[#181b22] border-[#343b4c] text-[#f3f5f8]';

    const toast = document.createElement('div');
    toast.setAttribute('role', 'status');
    toast.className = `pointer-events-auto rounded-lg border px-4 py-3 text-xs font-medium shadow-lg flex items-center justify-between gap-3 ${palette}`;

    const textSpan = document.createElement('span');
    textSpan.textContent = String(message);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Cerrar notificación');
    closeBtn.className = 'min-h-[44px] min-w-[44px] -my-2 -mr-2 flex items-center justify-center rounded hover:bg-black/20 text-current font-bold';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => toast.remove());

    toast.appendChild(textSpan);
    toast.appendChild(closeBtn);
    region.appendChild(toast);

    setTimeout(() => {
      if (toast.isConnected) toast.remove();
    }, 5000);
  }

  toggleVolumeEstimator() {
    this.estimatorExpanded = !this.estimatorExpanded;
    const card = document.getElementById('volume-estimator-card');
    const btn = document.getElementById('btn-toggle-estimator');
    const label = document.getElementById('label-toggle-estimator');
    if (card) card.classList.toggle('hidden', !this.estimatorExpanded);
    if (btn) btn.setAttribute('aria-expanded', String(this.estimatorExpanded));
    if (label) label.textContent = this.estimatorExpanded ? 'Ocultar Calculador de Cubaje' : 'Mostrar Calculador de Cubaje';
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.tab-content').forEach((section) => {
      section.classList.add('hidden');
    });

    const activeSection = document.getElementById(`tab-${tabId}`);
    if (activeSection) {
      activeSection.classList.remove('hidden');
    }

    document.querySelectorAll('.tab-btn').forEach((btn) => {
      const isTarget = btn.getAttribute('data-tab') === tabId;
      const variant = btn.getAttribute('data-variant');
      btn.setAttribute('aria-selected', String(isTarget));

      if (variant === 'mobile') {
        btn.className = isTarget
          ? 'tab-btn touch-target flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] text-[#fbbf24] font-bold px-1 py-1.5 rounded'
          : 'tab-btn touch-target flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] text-[#9aa4b5] hover:text-white px-1 py-1.5 rounded';
      } else {
        btn.className = isTarget
          ? 'tab-btn min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-[#fbbf24] bg-[#262010] border border-[#523e12] transition-colors text-left'
          : 'tab-btn min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-[#c8d0dc] hover:bg-[#20242e] hover:text-white transition-colors text-left';
      }
    });

    this.renderAll();
  }

  getEstimatorItems() {
    const readQty = (id) => Math.max(0, parseInt(document.getElementById(id)?.value || '0', 10) || 0);

    return [
      { name: 'Cajas Estándar', type: 'BOX_STANDARD', quantity: readQty('inp-box-std'), room: 'General', isFragile: false },
      { name: 'Escritorios', type: 'OFFICE_DESK', quantity: readQty('inp-desk'), room: 'Oficina', isFragile: false },
      { name: 'Sillas Giratorias', type: 'CUSTOM', customM3: 0.35, quantity: readQty('inp-chair'), room: 'Oficina', isFragile: false },
      { name: 'Bibliotecas / Racks', type: 'CUSTOM', customM3: 1.50, quantity: readQty('inp-rack'), room: 'Oficina', isFragile: false },
      { name: 'Monitores / PCs', type: 'SMART_TV_65', quantity: readQty('inp-monitor'), room: 'IT', isFragile: true },
      { name: 'Heladera / Freezer', type: 'REFRIGERATOR', quantity: readQty('inp-fridge'), room: 'Office / Cocina', isFragile: true }
    ];
  }

  updateVolumeEstimator() {
    const items = this.getEstimatorItems();
    const vol = VolumeCalculator.calculateTotalM3(items);
    const vehicle = vol.suggestedVehicle || VolumeCalculator.suggestVehicle(vol.totalM3);

    const netEl = document.getElementById('calc-net-vol');
    if (netEl) netEl.textContent = `${vol.netM3.toFixed(2)} m³`;

    const totalEl = document.getElementById('calc-total-vol');
    if (totalEl) totalEl.textContent = `${vol.totalM3.toFixed(2)} m³`;

    const vehicleEl = document.getElementById('calc-suggested-vehicle');
    if (vehicleEl) vehicleEl.textContent = `Sugerido: ${vehicle.name} (${vehicle.capacityM3} m³)`;

    return { items, vol, vehicle };
  }

  openModal(modalId, triggerEl = null, focusId = null) {
    this.lastModalTrigger = triggerEl || document.activeElement;
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('hidden');
    if (focusId) {
      requestAnimationFrame(() => document.getElementById(focusId)?.focus());
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal || modal.classList.contains('hidden')) return;
    modal.classList.add('hidden');
    if (this.lastModalTrigger && typeof this.lastModalTrigger.focus === 'function') {
      this.lastModalTrigger.focus();
      this.lastModalTrigger = null;
    }
  }

  closeAllModals() {
    ['modal-new-move', 'modal-new-damage', 'modal-new-storage', 'modal-epod-sign', 'modal-confirm-purge'].forEach((id) => {
      this.closeModal(id);
    });
  }

  openMoveModal(fromEstimator = false, triggerEl = null) {
    const { items, vol, vehicle } = this.updateVolumeEstimator();
    const activeItems = items.filter((it) => it.quantity > 0);
    const totalUnits = activeItems.reduce((sum, it) => sum + it.quantity, 0);

    const vehicleSelect = document.getElementById('inp-move-vehicle');
    if (vehicleSelect && vehicle?.id) {
      vehicleSelect.value = vehicle.id;
    }

    const summaryEl = document.getElementById('move-modal-inventory-summary');
    if (summaryEl) {
      summaryEl.textContent =
        totalUnits > 0
          ? `${fromEstimator ? 'Inventario aplicado del estimador' : 'Inventario base del estimador'}: ${totalUnits} unidades (${vol.totalM3.toFixed(2)} m³ con buffer).`
          : 'Sin ítems en el estimador: ingrese cantidades antes de crear o se generará un bulto general.';
    }

    this.openModal('modal-new-move', triggerEl, 'inp-move-customer');
  }

  handleCreateMove() {
    const btnSubmit = document.getElementById('btn-submit-move');
    if (btnSubmit) btnSubmit.disabled = true;

    try {
      const customer = document.getElementById('inp-move-customer').value.trim();
      const phone = document.getElementById('inp-move-phone').value.trim();
      const origin = document.getElementById('inp-move-origin').value.trim();
      const dest = document.getElementById('inp-move-dest').value.trim();
      const price = parseFloat(document.getElementById('inp-move-price').value) || 280000;
      const deposit = parseFloat(document.getElementById('inp-move-deposit').value) || 0;
      const assignedVehicle = document.getElementById('inp-move-vehicle')?.value || 'TRUCK_MEDIUM';

      let items = this.getEstimatorItems().filter((it) => it.quantity > 0);
      if (items.length === 0) {
        items = [{ name: 'Bulto General de Mudanza', type: 'BOX_STANDARD', quantity: 1, room: 'General', isFragile: false }];
      }

      if (BoxTrackCacheService.isPurged()) {
        BoxTrackCacheService.resetPurgeForTesting();
      }

      const order = MoveOrderService.createOrder({
        customerId: `CLI-${Date.now().toString(36).slice(-4)}`,
        customerName: customer,
        customerPhone: phone,
        originAddress: origin,
        destinationAddress: dest,
        scheduledDate: new Date().toISOString().split('T')[0],
        items,
        damages: [],
        assignedVehicle,
        pricing: { totalAmount: price, depositPaid: deposit }
      });

      this.orders.push(order);
      this.selectedOrderId = order.orderId;
      this.persistState();
      document.getElementById('form-create-move')?.reset();
      this.closeModal('modal-new-move');
      this.renderAll();
      this.showToast(`Orden ${order.orderId} creada (${order.volumeSummary.totalM3.toFixed(2)} m³).`, 'success');
    } catch (err) {
      this.showToast(err?.message || 'Error al crear la orden de mudanza.', 'error');
    } finally {
      if (btnSubmit) btnSubmit.disabled = false;
    }
  }

  readAndCompressPhoto(file) {
    return new Promise((resolve, reject) => {
      if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
        reject(new Error('Formato de imagen no permitido. Use PNG, JPEG o WebP.'));
        return;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        reject(new Error('La fotografía supera el límite de 2 MB.'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Archivo de imagen inválido.'));
        img.onload = () => {
          const maxDim = 640;
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  async handleCreateDamage() {
    const btnSubmit = document.getElementById('btn-submit-damage');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Guardando...';
    }

    try {
      const item = document.getElementById('inp-damage-item').value.trim();
      const type = document.getElementById('inp-damage-type').value;
      const loc = document.getElementById('inp-damage-loc').value.trim();
      const desc = document.getElementById('inp-damage-desc').value.trim();
      const photoInput = document.getElementById('inp-damage-photo');
      const file = photoInput?.files?.[0] || null;

      let photoWitnessUrl = '';
      if (file) {
        photoWitnessUrl = await this.readAndCompressPhoto(file);
      }

      if (BoxTrackCacheService.isPurged()) {
        BoxTrackCacheService.resetPurgeForTesting();
      }

      const damage = DamagePreInspectionEngine.recordPreExistingDamage({
        itemTag: `ITEM-${Date.now().toString(36).slice(-4)}`,
        itemName: item,
        damageType: type,
        locationOnItem: loc,
        description: desc,
        photoWitnessUrl
      });

      this.damages.push(damage);
      this.persistState();
      document.getElementById('form-create-damage')?.reset();
      this.closeModal('modal-new-damage');
      this.renderAll();
      this.showToast(`Acta pericial ${damage.damageId} registrada.`, 'success');
    } catch (err) {
      this.showToast(err?.message || 'Error al registrar el acta pericial.', 'error');
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Grabar Acta Pericial';
      }
    }
  }

  handleCreateStorageContract() {
    const btnSubmit = document.getElementById('btn-submit-storage');
    if (btnSubmit) btnSubmit.disabled = true;

    try {
      const customerName = document.getElementById('inp-storage-customer').value.trim();
      const customerPhone = document.getElementById('inp-storage-phone').value.trim();
      const unitCode = document.getElementById('inp-storage-unit-code').value.trim();
      const unitType = document.getElementById('inp-storage-unit-type').value;
      const monthlyFeeArs = parseFloat(document.getElementById('inp-storage-fee').value) || 95000;
      const dueDayOfMonth = Math.min(28, Math.max(1, parseInt(document.getElementById('inp-storage-due-day').value, 10) || 15));

      if (BoxTrackCacheService.isPurged()) {
        BoxTrackCacheService.resetPurgeForTesting();
      }

      const newContract = StorageContractService.createContract({
        unitCode,
        unitType,
        customerId: `CLI-${Date.now().toString(36).slice(-4)}`,
        customerName,
        customerPhone,
        monthlyFeeArs,
        dueDayOfMonth
      });

      this.contracts.push(newContract);
      this.persistState();
      document.getElementById('form-create-storage')?.reset();
      this.closeModal('modal-new-storage');
      this.renderAll();
      this.showToast(`Contrato ${newContract.contractId} (${newContract.unitCode}) registrado.`, 'success');
    } catch (err) {
      this.showToast(err?.message || 'No se pudo registrar el contrato de baulera.', 'error');
    } finally {
      if (btnSubmit) btnSubmit.disabled = false;
    }
  }

  openEpodModal(orderId, mode, triggerEl) {
    const order = this.orders.find((o) => o.orderId === orderId);
    if (!order) return;

    this.epodState = { orderId, mode };
    const titleEl = document.getElementById('modal-epod-title');
    const contextEl = document.getElementById('epod-order-context');
    const crewGroup = document.getElementById('epod-crew-group');
    const crewInput = document.getElementById('inp-epod-crew-name');
    const clientInput = document.getElementById('inp-epod-client-name');
    const payGroup = document.getElementById('epod-payment-group');
    const payInput = document.getElementById('inp-epod-final-payment');
    const submitBtn = document.getElementById('btn-submit-epod');
    const attestEl = document.getElementById('inp-epod-attest');

    if (attestEl) attestEl.checked = false;
    if (clientInput) clientInput.value = '';
    if (contextEl) contextEl.textContent = `${order.orderId} | ${order.customerName}`;

    if (mode === 'origin') {
      if (titleEl) titleEl.textContent = 'Acta ePOD de Carga en Origen';
      if (crewGroup) crewGroup.classList.remove('hidden');
      if (crewInput) {
        crewInput.required = true;
        crewInput.value = '';
      }
      if (payGroup) payGroup.classList.add('hidden');
      if (submitBtn) submitBtn.textContent = 'Sellar Carga en Origen (SHA-256)';
    } else {
      if (titleEl) titleEl.textContent = 'Acta ePOD de Entrega Final en Destino';
      if (crewGroup) crewGroup.classList.add('hidden');
      if (crewInput) crewInput.required = false;
      if (payGroup) payGroup.classList.remove('hidden');
      if (payInput) payInput.value = String(order.pricing?.balanceDue ?? 0);
      if (submitBtn) submitBtn.textContent = 'Confirmar Entrega y Liquidar';
    }

    this.openModal(
      'modal-epod-sign',
      triggerEl,
      mode === 'origin' ? 'inp-epod-crew-name' : 'inp-epod-client-name'
    );
  }

  handleSubmitEpod() {
    const { orderId, mode } = this.epodState;
    const idx = this.orders.findIndex((o) => o.orderId === orderId);
    if (idx === -1) return;

    try {
      const clientName = document.getElementById('inp-epod-client-name').value.trim();
      const attested = document.getElementById('inp-epod-attest').checked;
      if (!clientName || !attested) {
        this.showToast('Complete la identidad del firmante y la confirmación de custodia.', 'warning');
        return;
      }

      if (mode === 'origin') {
        const crewName = document.getElementById('inp-epod-crew-name').value.trim();
        if (!crewName) {
          this.showToast('Ingrese el nombre y legajo del responsable de cuadrilla.', 'warning');
          return;
        }
        this.orders[idx] = MoveOrderService.sealOriginLoading(this.orders[idx], {
          crewLeaderName: crewName,
          customerSignature: `FIRMADO_ORIGEN:${clientName}`,
          crewSignature: `FIRMADO_CUADRILLA:${crewName}`
        });
        this.persistState();
        this.closeModal('modal-epod-sign');
        this.renderAll();
        this.showToast(`Acta sellada con SHA-256 para ${orderId}.`, 'success');
      } else {
        const finalPayment = parseFloat(document.getElementById('inp-epod-final-payment').value) || 0;
        this.orders[idx] = MoveOrderService.confirmDestinationDelivery(this.orders[idx], {
          customerFinalSignature: `FIRMADO_DESTINO:${clientName}`,
          finalPayment
        });
        this.persistState();
        this.closeModal('modal-epod-sign');
        this.renderAll();
        this.showToast(`Entrega ePOD confirmada para ${orderId}.`, 'success');
      }
    } catch (err) {
      this.showToast(err?.message || 'Error al registrar firma ePOD.', 'error');
    }
  }

  handleVerifySeal(orderId) {
    const order = this.orders.find((o) => o.orderId === orderId);
    if (!order) return;
    const isValid = MoveOrderService.verifyOrderSeal(order);
    if (isValid) {
      this.showToast(`Sello SHA-256 verificado sin alteraciones para ${orderId}.`, 'success');
    } else {
      this.showToast(`Alerta: el sello SHA-256 de ${orderId} no coincide con el contenido actual.`, 'error');
    }
  }

  handlePurgeDemo() {
    BoxTrackCacheService.purgeData();
    this.orders = [];
    this.damages = [];
    this.contracts = [];
    this.selectedOrderId = null;
    this.closeModal('modal-confirm-purge');
    this.renderAll();
    this.showToast('Datos demo purgados. El sistema está listo para operación real.', 'success');
  }

  handleWhatsAppNotify(orderId) {
    const order = this.orders.find((o) => o.orderId === orderId);
    if (!order) return;
    if (!order.customerPhone) {
      this.showToast('La orden no tiene un teléfono WhatsApp válido.', 'warning');
      return;
    }

    const url = WhatsAppBoxNotifierService.notifyMoveManifest({
      phone: order.customerPhone,
      customerName: order.customerName,
      orderId: order.orderId,
      bultosCount: order.items?.length || 0,
      totalM3: order.volumeSummary?.totalM3 || 0
    });
    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    if (!popup) {
      this.showToast('El navegador bloqueó la ventana emergente de WhatsApp.', 'warning');
    }
  }

  renderDemoControls() {
    const showDemo = this.hasDemoData();
    document.getElementById('btn-purge-demo')?.classList.toggle('hidden', !showDemo);
    document.getElementById('demo-banner')?.classList.toggle('hidden', !showDemo);
  }

  renderAll() {
    this.renderDemoControls();
    this.renderMetrics();
    this.renderDashboardTable();
    this.renderMoveCards();
    this.renderDamagesGrid();
    this.renderInventorySelector();
    this.renderInventoryTable();
    this.renderStorageCards();
  }

  renderMetrics() {
    const activeMoves = this.orders.filter((m) => m.status !== 'DELIVERED_CONFIRMED').length;
    const totalM3 = this.orders.reduce((sum, m) => sum + (m.volumeSummary?.netM3 || 0), 0);
    const dunningAlerts = this.contracts.filter((c) => c.currentDunning?.status !== 'OCUPADO_AL_DIA').length;

    const elActive = document.getElementById('metric-active-moves');
    if (elActive) elActive.textContent = String(activeMoves);

    const elM3 = document.getElementById('metric-total-m3');
    if (elM3) elM3.textContent = totalM3.toFixed(2);

    const elStorage = document.getElementById('metric-storage-units');
    if (elStorage) elStorage.textContent = String(this.contracts.length);

    const elAlerts = document.getElementById('metric-dunning-alerts');
    if (elAlerts) elAlerts.textContent = String(dunningAlerts);
  }

  renderDashboardTable() {
    const tbody = document.getElementById('dashboard-moves-tbody');
    if (!tbody) return;

    if (this.orders.length === 0) {
      Sanitizer.safeSetInnerHTML(
        tbody,
        '<tr><td colspan="6" class="px-4 py-8 text-center text-[#9aa4b5]">No hay mudanzas activas registradas.</td></tr>'
      );
      return;
    }

    const rowsHtml = this.orders
      .map((m) => {
        const badge = Formatters.formatMoveStatusBadge(m.status);
        const sealPreview = m.cryptoSeal ? `${m.cryptoSeal.slice(0, 12)}...` : 'Pendiente';
        return `
          <tr class="hover:bg-[#20242e] transition-colors">
            <td class="px-4 py-3 font-mono font-bold text-[#fbbf24]">${Sanitizer.escapeHTML(m.orderId)}</td>
            <td class="px-4 py-3 font-medium text-white">
              ${Sanitizer.escapeHTML(m.customerName)}
              ${m.isDemo ? '<span class="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#2b220d] text-[#fbbf24] border border-[#594314]">DEMO</span>' : ''}
            </td>
            <td class="px-4 py-3 text-[#9aa4b5] text-xs">${Sanitizer.escapeHTML(m.originAddress)} &rarr; ${Sanitizer.escapeHTML(m.destinationAddress)}</td>
            <td class="px-4 py-3 font-mono tabular-nums text-[#38bdf8]">${Formatters.formatCubicMeters(m.volumeSummary?.totalM3)}</td>
            <td class="px-4 py-3"><span class="${badge.badgeClass}">${Sanitizer.escapeHTML(badge.label)}</span></td>
            <td class="px-4 py-3 font-mono text-xs text-emerald-300">${Sanitizer.escapeHTML(sealPreview)}</td>
          </tr>
        `;
      })
      .join('');

    Sanitizer.safeSetInnerHTML(tbody, rowsHtml);
  }

  renderMoveCards() {
    const container = document.getElementById('moves-cards-container');
    if (!container) return;

    const countBadge = document.getElementById('moves-count-badge');
    if (countBadge) countBadge.textContent = `${this.orders.length} registradas`;

    if (this.orders.length === 0) {
      Sanitizer.safeSetInnerHTML(
        container,
        '<div class="col-span-full bg-[#181b22] border border-[#2b3140] rounded-xl py-10 px-4 text-center text-[#9aa4b5]">No hay órdenes de mudanza registradas. Cree una nueva orden desde el botón superior.</div>'
      );
      return;
    }

    const fleetMap = new Map(VEHICLE_FLEET.map((v) => [v.id, v]));

    const cardsHtml = this.orders
      .map((m) => {
        const badge = Formatters.formatMoveStatusBadge(m.status);
        const isDelivered = m.status === 'DELIVERED_CONFIRMED';
        const isInTransit = m.status === 'EN_TRANSITO';
        const vehicle = fleetMap.get(m.assignedVehicle || m.volumeSummary?.suggestedVehicle?.id);

        return `
          <article class="bg-[#181b22] border border-[#2b3140] rounded-xl p-4 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#2b3140] pb-2.5">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono font-bold text-sm text-[#fbbf24]">${Sanitizer.escapeHTML(m.orderId)}</span>
                <span class="${badge.badgeClass}">${Sanitizer.escapeHTML(badge.label)}</span>
                ${m.isDemo ? '<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#2b220d] text-[#fbbf24] border border-[#594314]">DEMO</span>' : ''}
              </div>
              <span class="text-xs font-mono tabular-nums text-[#38bdf8]">${Formatters.formatCubicMeters(m.volumeSummary?.totalM3)}</span>
            </div>

            <div class="space-y-1">
              <h4 class="text-white">${Sanitizer.escapeHTML(m.customerName)}</h4>
              <p class="text-xs text-[#9aa4b5] flex items-center gap-1.5">
                ${SVG_ICONS.pin} <span>${Sanitizer.escapeHTML(m.originAddress)}</span>
              </p>
              <p class="text-xs text-[#9aa4b5] flex items-center gap-1.5">
                ${SVG_ICONS.flag} <span>${Sanitizer.escapeHTML(m.destinationAddress)}</span>
              </p>
              ${vehicle ? `<p class="text-xs text-[#c8d0dc] font-mono pt-1">Flota: ${Sanitizer.escapeHTML(vehicle.name)} (${vehicle.capacityM3} m³)</p>` : ''}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 border-t border-[#2b3140]">
              <div>
                <span class="text-[#9aa4b5] block">Total Cotizado</span>
                <span class="font-mono tabular-nums font-semibold text-[#f3f5f8]">${Formatters.formatCurrencyArs(m.pricing?.totalAmount)}</span>
              </div>
              <div>
                <span class="text-[#9aa4b5] block">Saldo Pendiente</span>
                <span class="font-mono tabular-nums font-bold ${m.pricing?.balanceDue > 0 ? 'text-[#fbbf24]' : 'text-emerald-300'}">
                  ${Formatters.formatCurrencyArs(m.pricing?.balanceDue)}
                </span>
              </div>
            </div>

            ${
              m.cryptoSeal
                ? `
              <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#2b3140] text-xs font-mono text-emerald-300">
                <div class="flex items-center gap-1.5 min-w-0">
                  ${SVG_ICONS.lock}
                  <span class="truncate">SHA-256: ${Sanitizer.escapeHTML(m.cryptoSeal)}</span>
                </div>
                <button type="button" class="btn-verify-seal min-h-[44px] px-3 py-1.5 rounded-lg bg-[#222630] hover:bg-[#2c3240] text-[#e8ecf2] border border-[#343b4c] text-xs font-sans font-semibold" data-order-id="${Sanitizer.escapeHTML(m.orderId)}">
                  Verificar Sello
                </button>
              </div>
            `
                : ''
            }

            <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#2b3140]">
              <button type="button" class="btn-wa-notify min-h-[44px] px-3 py-2 rounded-lg bg-[#222630] hover:bg-[#2c3240] text-[#e8ecf2] border border-[#343b4c] text-xs font-semibold flex items-center gap-1.5" data-order-id="${Sanitizer.escapeHTML(m.orderId)}">
                ${SVG_ICONS.message} <span>Aviso WhatsApp</span>
              </button>

              <div class="flex flex-wrap items-center gap-2">
                ${
                  !isInTransit && !isDelivered
                    ? `
                  <button type="button" class="btn-origin-checkin min-h-[44px] px-3.5 py-2 rounded-lg bg-[#f59e0b] hover:bg-[#d97706] text-[#0f1115] text-xs font-extrabold" data-order-id="${Sanitizer.escapeHTML(m.orderId)}">
                    Cargar y Sellar Origen
                  </button>
                `
                    : ''
                }

                ${
                  isInTransit
                    ? `
                  <button type="button" class="btn-dest-deliver min-h-[44px] px-3.5 py-2 rounded-lg bg-[#047857] hover:bg-[#065f46] text-white text-xs font-bold" data-order-id="${Sanitizer.escapeHTML(m.orderId)}">
                    Entregar y Liquidar ePOD
                  </button>
                `
                    : ''
                }

                ${
                  isDelivered
                    ? `
                  <span class="min-h-[44px] text-xs font-semibold text-emerald-300 flex items-center gap-1.5 px-2">
                    ${SVG_ICONS.check} <span>Entregado y Cerrado</span>
                  </span>
                `
                    : ''
                }
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    Sanitizer.safeSetInnerHTML(container, cardsHtml);

    container.querySelectorAll('.btn-origin-checkin').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-order-id');
        this.openEpodModal(id, 'origin', e.currentTarget);
      });
    });

    container.querySelectorAll('.btn-dest-deliver').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-order-id');
        this.openEpodModal(id, 'delivery', e.currentTarget);
      });
    });

    container.querySelectorAll('.btn-verify-seal').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-order-id');
        this.handleVerifySeal(id);
      });
    });

    container.querySelectorAll('.btn-wa-notify').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-order-id');
        this.handleWhatsAppNotify(id);
      });
    });
  }

  renderDamagesGrid() {
    const grid = document.getElementById('damages-records-grid');
    if (!grid) return;

    const countBadge = document.getElementById('damages-count-badge');
    if (countBadge) countBadge.textContent = `${this.damages.length} actas`;

    if (this.damages.length === 0) {
      Sanitizer.safeSetInnerHTML(
        grid,
        '<div class="col-span-full bg-[#181b22] border border-[#2b3140] rounded-xl py-10 px-4 text-center text-[#9aa4b5]">No se han registrado daños previos. Todos los bienes ingresan sin observaciones.</div>'
      );
      return;
    }

    const cardsHtml = this.damages
      .map((d) => {
        const safePhoto = Sanitizer.sanitizeURL(d.photoWitnessUrl);
        const hasPhoto = Boolean(safePhoto && safePhoto !== '#');

        return `
          <article class="bg-[#181b22] border border-[#2b3140] rounded-xl p-4 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#2b3140] pb-2.5">
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs font-bold text-rose-300">${Sanitizer.escapeHTML(d.damageId)}</span>
                ${d.isDemo ? '<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#2b220d] text-[#fbbf24] border border-[#594314]">DEMO</span>' : ''}
              </div>
              <span class="text-xs px-2 py-0.5 rounded bg-rose-950 text-rose-200 border border-rose-700 font-semibold">
                ${Sanitizer.escapeHTML(d.damageLabel || d.damageType)}
              </span>
            </div>

            <div>
              <h4 class="text-white">${Sanitizer.escapeHTML(d.itemName)}</h4>
              <p class="text-xs text-[#9aa4b5] mt-1">Ubicación: <strong class="text-[#e2e8f0]">${Sanitizer.escapeHTML(d.locationOnItem)}</strong></p>
            </div>

            <p class="text-xs text-[#c8d0dc] pt-2 border-t border-[#2b3140] italic">
              "${Sanitizer.escapeHTML(d.description)}"
            </p>

            ${
              hasPhoto
                ? `
              <div class="rounded-lg overflow-hidden border border-[#2b3140] h-32 bg-[#14161d] relative">
                <img src="${safePhoto}" alt="Testigo fotográfico de ${Sanitizer.escapeHTML(d.itemName)}" class="w-full h-full object-cover">
                <span class="absolute bottom-1.5 right-1.5 text-[11px] bg-black/80 px-2 py-0.5 rounded text-[#f3f5f8] font-mono">
                  Testigo Local
                </span>
              </div>
            `
                : `
              <div class="rounded-lg border border-dashed border-[#343b4c] h-24 bg-[#14161d] flex flex-col items-center justify-center gap-1 px-3 text-center">
                ${SVG_ICONS.camera}
                <span class="text-xs text-[#9aa4b5]">
                  ${d.isDemo ? '[DEMO] Sin fotografía adjunta' : 'Sin fotografía adjunta (acta textual)'}
                </span>
              </div>
            `
            }
          </article>
        `;
      })
      .join('');

    Sanitizer.safeSetInnerHTML(grid, cardsHtml);
  }

  renderInventorySelector() {
    const sel = document.getElementById('select-move-for-inventory');
    const printBtn = document.getElementById('btn-print-bulto-tags');
    if (!sel) return;

    if (this.orders.length === 0) {
      Sanitizer.safeSetInnerHTML(sel, '<option value="">No hay mudanzas disponibles</option>');
      if (printBtn) printBtn.disabled = true;
      return;
    }

    if (!this.orders.some((o) => o.orderId === this.selectedOrderId)) {
      this.selectedOrderId = this.orders[0].orderId;
    }

    if (printBtn) printBtn.disabled = false;

    const optionsHtml = this.orders
      .map(
        (m) => `
      <option value="${Sanitizer.escapeHTML(m.orderId)}" ${m.orderId === this.selectedOrderId ? 'selected' : ''}>
        ${Sanitizer.escapeHTML(m.orderId)} - ${Sanitizer.escapeHTML(m.customerName)} (${Formatters.formatCubicMeters(m.volumeSummary?.totalM3)})
      </option>
    `
      )
      .join('');

    Sanitizer.safeSetInnerHTML(sel, optionsHtml);
  }

  renderInventoryTable() {
    const container = document.getElementById('bultos-table-container');
    if (!container) return;

    const order = this.orders.find((o) => o.orderId === this.selectedOrderId);
    if (!order || !order.items || order.items.length === 0) {
      Sanitizer.safeSetInnerHTML(
        container,
        '<div class="py-8 px-4 text-center text-[#9aa4b5]">Seleccione una mudanza para visualizar los bultos rotulados con QR.</div>'
      );
      return;
    }

    const tableHtml = `
      <table class="w-full text-left text-xs text-[#e2e8f0]">
        <thead class="text-[#9aa4b5] border-b border-[#2b3140] text-[11px] uppercase tracking-wider font-mono">
          <tr>
            <th class="px-4 py-3">Rótulo QR</th>
            <th class="px-4 py-3">Ítem Inventariado</th>
            <th class="px-4 py-3">Ambiente</th>
            <th class="px-4 py-3">Carga en Origen</th>
            <th class="px-4 py-3">Descarga en Destino</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#262c3a] font-sans">
          ${order.items
            .map(
              (b) => `
            <tr class="hover:bg-[#20242e] transition-colors">
              <td class="px-4 py-3 font-mono font-bold text-[#fbbf24]">
                <span class="inline-flex items-center gap-2">
                  ${SVG_ICONS.box}
                  <span>${Sanitizer.escapeHTML(b.bultoCode)}</span>
                </span>
              </td>
              <td class="px-4 py-3 font-medium text-white">${Sanitizer.escapeHTML(b.name)} (${Number(b.quantity) || 1})</td>
              <td class="px-4 py-3 text-[#9aa4b5]">${Sanitizer.escapeHTML(b.room || 'General')}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center gap-1.5 text-xs font-semibold ${b.loadedInTruck ? 'text-emerald-300' : 'text-[#9aa4b5]'}">
                  ${b.loadedInTruck ? SVG_ICONS.check : SVG_ICONS.clock}
                  <span>${b.loadedInTruck ? 'Estibado' : 'Pendiente'}</span>
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center gap-1.5 text-xs font-semibold ${b.deliveredInDestination ? 'text-emerald-300' : 'text-[#9aa4b5]'}">
                  ${b.deliveredInDestination ? SVG_ICONS.check : SVG_ICONS.clock}
                  <span>${b.deliveredInDestination ? 'Entregado' : 'En Tránsito'}</span>
                </span>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;

    Sanitizer.safeSetInnerHTML(container, tableHtml);
  }

  renderStorageCards() {
    const container = document.getElementById('storage-contracts-container');
    if (!container) return;

    if (this.contracts.length === 0) {
      Sanitizer.safeSetInnerHTML(
        container,
        '<div class="col-span-full bg-[#181b22] border border-[#2b3140] rounded-xl py-10 px-4 text-center text-[#9aa4b5]">No hay contratos de bauleras activos.</div>'
      );
      return;
    }

    const cardsHtml = this.contracts
      .map((c) => {
        const dunning = c.currentDunning || {};
        const badge = Formatters.formatStorageStatusBadge(dunning.status);
        const isBlocked = !dunning.accessGranted;

        return `
          <article class="bg-[#181b22] border border-[#2b3140] rounded-xl p-4 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#2b3140] pb-2.5">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono font-bold text-base text-emerald-300">${Sanitizer.escapeHTML(c.unitCode)}</span>
                <span class="${badge.badgeClass}">${Sanitizer.escapeHTML(badge.label)}</span>
                ${c.isDemo ? '<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#2b220d] text-[#fbbf24] border border-[#594314]">DEMO</span>' : ''}
              </div>
              <span class="text-xs font-mono tabular-nums text-[#9aa4b5]">${Formatters.formatCubicMeters(c.capacityM3)}</span>
            </div>

            <div>
              <h4 class="text-white">${Sanitizer.escapeHTML(c.customerName)}</h4>
              <p class="text-xs text-[#9aa4b5] mt-1">Vencimiento: <strong class="text-[#e2e8f0] font-mono tabular-nums">${Formatters.formatDate(c.nextDueDate)}</strong></p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 border-t border-[#2b3140]">
              <div>
                <span class="text-[#9aa4b5] block">Alquiler Mensual</span>
                <span class="font-mono tabular-nums font-semibold text-[#f3f5f8]">${Formatters.formatCurrencyArs(c.monthlyFeeArs)}</span>
              </div>
              <div>
                <span class="text-[#9aa4b5] block">Días de Atraso</span>
                <span class="font-mono tabular-nums font-bold ${dunning.daysOverdue > 0 ? 'text-rose-300' : 'text-emerald-300'}">
                  ${dunning.daysOverdue || 0} días
                </span>
              </div>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-[#2b3140] text-xs">
              <span class="text-[#9aa4b5]">Estado de Acceso:</span>
              <span class="inline-flex items-center gap-1.5 font-mono font-bold ${isBlocked ? 'text-rose-300' : 'text-[#38bdf8]'}">
                ${isBlocked ? SVG_ICONS.shieldAlert : SVG_ICONS.key}
                <span>${isBlocked ? 'PIN BLOQUEADO' : 'PIN HABILITADO'}</span>
              </span>
            </div>

            ${
              dunning.penaltyAmount > 0
                ? `
              <div class="text-xs bg-rose-950/60 text-rose-200 px-3 py-2 rounded border border-rose-800 flex items-center justify-between">
                <span>Recargo por Mora:</span>
                <span class="font-mono tabular-nums font-bold">${Formatters.formatCurrencyArs(dunning.penaltyAmount)}</span>
              </div>
            `
                : ''
            }

            <div class="pt-3 border-t border-[#2b3140] flex justify-end">
              <button type="button" class="btn-wa-storage min-h-[44px] px-3.5 py-2 rounded-lg bg-[#222630] hover:bg-[#2c3240] text-[#e8ecf2] border border-[#343b4c] text-xs font-semibold flex items-center gap-1.5" data-contract-id="${Sanitizer.escapeHTML(c.contractId)}">
                ${SVG_ICONS.message} <span>Aviso WhatsApp de Cobranza</span>
              </button>
            </div>
          </article>
        `;
      })
      .join('');

    Sanitizer.safeSetInnerHTML(container, cardsHtml);

    container.querySelectorAll('.btn-wa-storage').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-contract-id');
        const contract = this.contracts.find((c) => c.contractId === id);
        if (!contract) return;
        const url = WhatsAppBoxNotifierService.notifyStorageRent({
          phone: contract.customerPhone,
          customerName: contract.customerName,
          unitCode: contract.unitCode,
          totalToPay: (contract.monthlyFeeArs || 0) + (contract.currentDunning?.penaltyAmount || 0),
          status: contract.currentDunning?.status
        });
        const popup = window.open(url, '_blank', 'noopener,noreferrer');
        if (!popup) {
          this.showToast('El navegador bloqueó la ventana emergente de WhatsApp.', 'warning');
        }
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new BoxTrackApp();
  app.init();
});
