/**
 * BoxTrack - Main Application Orchestrator
 * Integración de Cubaje Forense, Rótulos QR, Actas Pre-Daño,
 * Mudanzas Corporativas y Guardamuebles con Sello SHA-256.
 */

import { VolumeCalculator } from './core/volumeCalculator.js';
import { DamagePreInspectionEngine } from './core/damagePreInspectionEngine.js';
import { StorageContractService } from './services/storageContractService.js';
import { MoveOrderService } from './services/moveOrderService.js';
import { ExportService } from './services/exportService.js';
import { BoxTrackCacheService } from './services/boxTrackCache.service.js';
import { WhatsAppBoxNotifierService } from './services/whatsAppBoxNotifier.service.js';
import { Sanitizer } from './utils/sanitizer.js';
import { Formatters } from './utils/formatters.js?v=2';

class BoxTrackApp {
  constructor() {
    this.orders = [];
    this.damages = [];
    this.contracts = [];
    this.activeTab = 'moves';
    this.selectedOrderId = null;
  }

  init() {
    this.seedInitialDemoData();
    this.bindEvents();
    this.updateVolumeEstimator();
    this.renderAll();
  }

  seedInitialDemoData() {
    if (BoxTrackCacheService.isPurged()) {
      return;
    }

    // 1. Daño previo testigo
    const damageSample = DamagePreInspectionEngine.recordPreExistingDamage({
      itemTag: 'ESCRIT-ROBLE-01',
      itemName: 'Escritorio Gerencial Roble',
      damageType: 'SURFACE_SCRATCH',
      locationOnItem: 'Tapa superior extremo derecho',
      description: 'Rayón profundo en tapa de 12cm preexistente a embalaje',
      photoWitnessUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400',
      isFragile: false
    });
    this.damages.push(damageSample);

    // 2. Orden de mudanza demo
    const demoItems = [
      { name: 'Smart TV 75" Sala Reuniones', type: 'SMART_TV_65', quantity: 1, room: 'Directorio', isFragile: true },
      { name: 'Cajas Archivo y Documentación', type: 'BOX_STANDARD', quantity: 25, room: 'Administración', isFragile: false },
      { name: 'Puesto de Trabajo Gerencial', type: 'DESK_LARGE', quantity: 2, room: 'Gerencia', isFragile: false },
      { name: 'Sillones Ergonómicos Mesh', type: 'SOFA_3_SEATS', quantity: 1, room: 'Recepción', isFragile: false }
    ];

    const order = MoveOrderService.createOrder({
      customerId: 'CLI-CORP-401',
      customerName: 'Finanzas Globales S.A.',
      customerPhone: '+5491133334444',
      originAddress: 'Av. Leandro N. Alem 850 Piso 12, CABA',
      destinationAddress: 'Av. del Libertador 6250 Piso 3, CABA',
      scheduledDate: new Date().toISOString().split('T')[0],
      items: demoItems,
      damages: [damageSample],
      pricing: { totalAmount: 380000, depositPaid: 150000 }
    });

    this.orders.push(order);
    this.selectedOrderId = order.orderId;

    // 3. Contratos de Guardamuebles
    const c1 = StorageContractService.createContract({
      unitCode: 'BOX-A-12',
      unitType: 'MEDIUM_15',
      customerId: 'CLI-ALB-11',
      customerName: 'Estudio Jurídico Albarracín',
      customerPhone: '+5491188889999',
      monthlyFeeArs: 85000,
      dueDayOfMonth: 28
    });

    const c2 = StorageContractService.createContract({
      unitCode: 'BOX-B-04',
      unitType: 'LARGE_30',
      customerId: 'CLI-CON-22',
      customerName: 'Constructora del Plata SRL',
      customerPhone: '+5491122223333',
      monthlyFeeArs: 140000,
      dueDayOfMonth: 5
    });

    const c3 = StorageContractService.createContract({
      unitCode: 'BOX-C-09',
      unitType: 'XL_60',
      customerId: 'CLI-DIS-33',
      customerName: 'Distribuidora San Martín',
      customerPhone: '+5491177778888',
      monthlyFeeArs: 220000,
      dueDayOfMonth: 1
    });

    // Simular mora forzando fechas pasadas para c2 y c3
    const past8 = new Date();
    past8.setDate(past8.getDate() - 8);
    c2.nextDueDate = past8.toISOString();
    c2.currentDunning = StorageContractService.evaluateContractStatus(c2).currentDunning;

    const past25 = new Date();
    past25.setDate(past25.getDate() - 25);
    c3.nextDueDate = past25.toISOString();
    c3.currentDunning = StorageContractService.evaluateContractStatus(c3).currentDunning;

    this.contracts.push(c1, c2, c3);
  }

  bindEvents() {
    // Navigation Tabs (Desktop & Mobile)
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-tab');
        if (target) this.switchTab(target);
      });
    });

    // Volume Estimator inputs
    ['inp-box-std', 'inp-desk', 'inp-chair', 'inp-rack', 'inp-monitor', 'inp-fridge'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.updateVolumeEstimator());
      }
    });

    // Apply Estimator to Move Order
    const btnApply = document.getElementById('btn-apply-estimator-to-move');
    if (btnApply) {
      btnApply.addEventListener('click', () => this.openMoveModal());
    }

    // Move Modals
    const btnNewMove = document.getElementById('btn-new-move');
    if (btnNewMove) btnNewMove.addEventListener('click', () => this.openMoveModal());

    const btnCloseMove = document.getElementById('btn-close-move-modal');
    if (btnCloseMove) btnCloseMove.addEventListener('click', () => this.closeMoveModal());

    const btnCancelMove = document.getElementById('btn-cancel-move');
    if (btnCancelMove) btnCancelMove.addEventListener('click', () => this.closeMoveModal());

    const formMove = document.getElementById('form-create-move');
    if (formMove) {
      formMove.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCreateMove();
      });
    }

    // Damage Modal
    const btnAddDamage = document.getElementById('btn-add-damage-modal');
    if (btnAddDamage) btnAddDamage.addEventListener('click', () => this.openDamageModal());

    const btnCloseDamage = document.getElementById('btn-close-damage-modal');
    if (btnCloseDamage) btnCloseDamage.addEventListener('click', () => this.closeDamageModal());

    const btnCancelDamage = document.getElementById('btn-cancel-damage');
    if (btnCancelDamage) btnCancelDamage.addEventListener('click', () => this.closeDamageModal());

    const formDamage = document.getElementById('form-create-damage');
    if (formDamage) {
      formDamage.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCreateDamage();
      });
    }

    // Inventory Order Selector
    const selMove = document.getElementById('select-move-for-inventory');
    if (selMove) {
      selMove.addEventListener('change', (e) => {
        this.selectedOrderId = e.target.value;
        this.renderInventoryTable();
      });
    }

    // Export CSV
    const btnCsv = document.getElementById('btn-export-csv');
    if (btnCsv) {
      btnCsv.addEventListener('click', () => {
        ExportService.downloadMovesCsv(this.orders);
      });
    }

    // Print Bulto Tags
    const btnPrintTags = document.getElementById('btn-print-bulto-tags');
    if (btnPrintTags) {
      btnPrintTags.addEventListener('click', () => {
        window.print();
      });
    }

    // New Storage Contract quick action
    const btnNewStorage = document.getElementById('btn-new-storage-contract');
    if (btnNewStorage) {
      btnNewStorage.addEventListener('click', () => {
        const name = prompt('Nombre del Cliente / Empresa para Alquiler de Baulera:');
        if (!name) return;
        const phone = prompt('Teléfono WhatsApp:', '+5491144445555');
        const unit = prompt('Código de Unidad (Ej: BOX-D-01):', 'BOX-D-01');
        const fee = prompt('Precio Mensual en ARS:', '110000');

        const newContract = StorageContractService.createContract({
          unitCode: unit || 'BOX-D-01',
          unitType: 'MEDIUM_15',
          customerId: `CLI-${Date.now().toString(36).slice(-4)}`,
          customerName: name,
          customerPhone: phone || '+5491100000000',
          monthlyFeeArs: parseFloat(fee) || 110000,
          dueDayOfMonth: 15
        });

        this.contracts.push(newContract);
        this.renderAll();
      });
    }
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.tab-content').forEach(section => {
      section.classList.add('hidden');
    });

    const activeSection = document.getElementById(`tab-${tabId}`);
    if (activeSection) {
      activeSection.classList.remove('hidden');
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
      const isTarget = btn.getAttribute('data-tab') === tabId;
      if (isTarget) {
        btn.classList.add('text-[#fbbf24]', 'font-semibold');
        btn.classList.remove('text-[#9aa4b5]');
      } else {
        btn.classList.remove('text-[#fbbf24]', 'font-semibold');
        btn.classList.add('text-[#9aa4b5]');
      }
    });

    this.renderAll();
  }

  updateVolumeEstimator() {
    const boxStd = parseInt(document.getElementById('inp-box-std')?.value || '0', 10);
    const desk = parseInt(document.getElementById('inp-desk')?.value || '0', 10);
    const chair = parseInt(document.getElementById('inp-chair')?.value || '0', 10);
    const rack = parseInt(document.getElementById('inp-rack')?.value || '0', 10);
    const monitor = parseInt(document.getElementById('inp-monitor')?.value || '0', 10);
    const fridge = parseInt(document.getElementById('inp-fridge')?.value || '0', 10);

    const items = [
      { name: 'Cajas Estándar', type: 'BOX_STANDARD', quantity: boxStd },
      { name: 'Escritorios', type: 'DESK_LARGE', quantity: desk },
      { name: 'Sillas Giratorias', type: 'SOFA_3_SEATS', quantity: chair },
      { name: 'Bibliotecas / Racks', type: 'BOOKSHELF', quantity: rack },
      { name: 'Monitores / PCs', type: 'SMART_TV_65', quantity: monitor },
      { name: 'Heladera / Frigobar', type: 'REFRIGERATOR_2D', quantity: fridge }
    ];

    const vol = VolumeCalculator.calculateTotalM3(items);
    const vehicle = vol.suggestedVehicle || VolumeCalculator.suggestVehicle(vol.totalM3);

    const netEl = document.getElementById('calc-net-vol');
    if (netEl) netEl.textContent = `${vol.netM3.toFixed(2)} m³`;

    const totalEl = document.getElementById('calc-total-vol');
    if (totalEl) totalEl.textContent = `${vol.totalM3.toFixed(2)} m³`;

    const vehicleEl = document.getElementById('calc-suggested-vehicle');
    if (vehicleEl) vehicleEl.textContent = `Sugerido: ${vehicle.name || vehicle.label} (${vehicle.capacityM3} m³)`;
  }

  openMoveModal() {
    document.getElementById('modal-new-move')?.classList.remove('hidden');
  }

  closeMoveModal() {
    document.getElementById('modal-new-move')?.classList.add('hidden');
  }

  handleCreateMove() {
    const customer = document.getElementById('inp-move-customer').value;
    const phone = document.getElementById('inp-move-phone').value;
    const origin = document.getElementById('inp-move-origin').value;
    const dest = document.getElementById('inp-move-dest').value;
    const price = parseFloat(document.getElementById('inp-move-price').value) || 280000;
    const deposit = parseFloat(document.getElementById('inp-move-deposit').value) || 100000;

    const boxStd = parseInt(document.getElementById('inp-box-std')?.value || '20', 10);
    const desk = parseInt(document.getElementById('inp-desk')?.value || '2', 10);

    const items = [
      { name: 'Cajas de Archivo y Enseres', type: 'BOX_STANDARD', quantity: boxStd, room: 'General', isFragile: false },
      { name: 'Puestos de Trabajo / Escritorio', type: 'DESK_LARGE', quantity: desk, room: 'Oficina', isFragile: false }
    ];

    const order = MoveOrderService.createOrder({
      customerId: `CLI-${Date.now().toString(36).slice(-4)}`,
      customerName: customer,
      customerPhone: phone,
      originAddress: origin,
      destinationAddress: dest,
      scheduledDate: new Date().toISOString().split('T')[0],
      items,
      damages: [],
      pricing: { totalAmount: price, depositPaid: deposit }
    });

    this.orders.push(order);
    this.selectedOrderId = order.orderId;
    this.closeMoveModal();
    this.renderAll();
  }

  openDamageModal() {
    document.getElementById('modal-new-damage')?.classList.remove('hidden');
  }

  closeDamageModal() {
    document.getElementById('modal-new-damage')?.classList.add('hidden');
  }

  handleCreateDamage() {
    const item = document.getElementById('inp-damage-item').value;
    const type = document.getElementById('inp-damage-type').value;
    const loc = document.getElementById('inp-damage-loc').value;
    const desc = document.getElementById('inp-damage-desc').value;

    const damage = DamagePreInspectionEngine.recordPreExistingDamage({
      itemTag: `ITEM-${Date.now().toString(36).slice(-4)}`,
      itemName: item,
      damageType: type,
      locationOnItem: loc,
      description: desc,
      photoWitnessUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400'
    });

    this.damages.push(damage);
    this.closeDamageModal();
    this.renderAll();
  }

  renderAll() {
    this.renderMetrics();
    this.renderDashboardTable();
    this.renderMoveCards();
    this.renderDamagesGrid();
    this.renderInventorySelector();
    this.renderInventoryTable();
    this.renderStorageCards();
  }

  renderMetrics() {
    const activeMoves = this.orders.filter(m => m.status !== 'DELIVERED_CONFIRMED').length;
    const totalM3 = this.orders.reduce((sum, m) => sum + (m.volumeSummary?.netM3 || 0), 0);
    const dunningAlerts = this.contracts.filter(c => c.currentDunning?.stage !== 'OCUPADO_AL_DIA').length;

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
      Sanitizer.safeSetInnerHTML(tbody, '<tr><td colspan="6" class="py-4 text-center text-[#7d8799]">No hay mudanzas activas</td></tr>');
      return;
    }

    const rowsHtml = this.orders.map(m => {
      const badge = Formatters.formatMoveStatusBadge(m.status);
      const sealPreview = m.cryptoSeal ? `${m.cryptoSeal.slice(0, 12)}...` : 'Pendiente';
      return `
        <tr class="hover:bg-slate-800/40 transition">
          <td class="py-3 font-mono font-bold text-[#fbbf24]">${Sanitizer.escapeHTML(m.orderId)}</td>
          <td class="py-3 font-medium text-white">${Sanitizer.escapeHTML(m.customerName)}</td>
          <td class="py-3 text-[#9aa4b5] text-[11px]">${Sanitizer.escapeHTML(m.originAddress)} &rarr; ${Sanitizer.escapeHTML(m.destinationAddress)}</td>
          <td class="py-3 font-mono text-cyan-400">${Formatters.formatCubicMeters(m.volumeSummary?.totalM3)}</td>
          <td class="py-3"><span class="${badge.badgeClass}">${badge.label}</span></td>
          <td class="py-3 font-mono text-[10px] text-emerald-400">${Sanitizer.escapeHTML(sealPreview)}</td>
        </tr>
      `;
    }).join('');

    Sanitizer.safeSetInnerHTML(tbody, rowsHtml);
  }

  renderMoveCards() {
    const container = document.getElementById('moves-cards-container');
    if (!container) return;

    const countBadge = document.getElementById('moves-count-badge');
    if (countBadge) countBadge.textContent = `${this.orders.length} registradas`;

    if (this.orders.length === 0) {
      Sanitizer.safeSetInnerHTML(container, '<div class="col-span-2 py-8 text-center text-[#7d8799]">No hay órdenes de mudanza registradas.</div>');
      return;
    }

    const cardsHtml = this.orders.map(m => {
      const badge = Formatters.formatMoveStatusBadge(m.status);
      const isDelivered = m.status === 'DELIVERED_CONFIRMED';
      const isInTransit = m.status === 'EN_TRANSITO';

      return `
        <div class="bg-[#13141a] border border-[#2b3140] rounded-xl p-4 space-y-3 shadow-md">
          <div class="flex items-center justify-between border-b border-[#2b3140]/80 pb-2">
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-sm text-[#fbbf24]">${Sanitizer.escapeHTML(m.orderId)}</span>
              <span class="${badge.badgeClass}">${badge.label}</span>
            </div>
            <span class="text-xs font-mono text-cyan-400">${Formatters.formatCubicMeters(m.volumeSummary?.totalM3)}</span>
          </div>

          <div>
            <h4 class="font-bold text-sm text-white">${Sanitizer.escapeHTML(m.customerName)}</h4>
            <p class="text-xs text-[#9aa4b5] flex items-center gap-1 mt-0.5">
              <span>📍</span> <span>${Sanitizer.escapeHTML(m.originAddress)}</span>
            </p>
            <p class="text-xs text-[#9aa4b5] flex items-center gap-1 mt-0.5">
              <span>🏁</span> <span>${Sanitizer.escapeHTML(m.destinationAddress)}</span>
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2 text-[11px] bg-[#181a21]/60 p-2.5 rounded-lg border border-[#2b3140]/50">
            <div>
              <span class="text-[#7d8799] block">Total Cotizado</span>
              <span class="font-mono font-semibold text-slate-200">${Formatters.formatCurrencyArs(m.pricing?.totalAmount)}</span>
            </div>
            <div>
              <span class="text-[#7d8799] block">Saldo Pendiente</span>
              <span class="font-mono font-bold ${m.pricing?.balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'}">
                ${Formatters.formatCurrencyArs(m.pricing?.balanceDue)}
              </span>
            </div>
          </div>

          ${m.cryptoSeal ? `
            <div class="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 p-2 rounded border border-emerald-500/20 truncate">
              🔒 Sello Origen SHA-256: ${Sanitizer.escapeHTML(m.cryptoSeal)}
            </div>
          ` : ''}

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2b3140]/60">
            <button class="btn-wa-notify px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[#c8d0dc] text-xs flex items-center gap-1" data-order-id="${Sanitizer.escapeHTML(m.orderId)}">
              <span>💬</span> <span>Aviso WhatsApp</span>
            </button>

            <div class="flex gap-1.5">
              ${!isInTransit && !isDelivered ? `
                <button class="btn-origin-checkin px-3 py-1 rounded bg-[#f59e0b] hover:bg-[#d97706] text-white text-xs font-semibold shadow" data-order-id="${Sanitizer.escapeHTML(m.orderId)}">
                  Cargar y Sellar Origen
                </button>
              ` : ''}

              ${isInTransit ? `
                <button class="btn-dest-deliver px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow" data-order-id="${Sanitizer.escapeHTML(m.orderId)}">
                  Entregar y Liquidar ePOD
                </button>
              ` : ''}

              ${isDelivered ? `
                <span class="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  ✔ Entregado y Cerrado
                </span>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    Sanitizer.safeSetInnerHTML(container, cardsHtml);

    // Bind card action buttons
    container.querySelectorAll('.btn-origin-checkin').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-order-id');
        this.handleOriginCheckIn(id);
      });
    });

    container.querySelectorAll('.btn-dest-deliver').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-order-id');
        this.handleDestinationDeliver(id);
      });
    });

    container.querySelectorAll('.btn-wa-notify').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-order-id');
        this.handleWhatsAppNotify(id);
      });
    });
  }

  handleOriginCheckIn(orderId) {
    const idx = this.orders.findIndex(o => o.orderId === orderId);
    if (idx === -1) return;

    this.orders[idx] = MoveOrderService.sealOriginLoading(this.orders[idx], {
      crewLeaderName: 'Capataz Juan Pérez (Legajo 402)',
      customerSignature: 'SIG_CLI_' + Date.now(),
      crewSignature: 'SIG_CREW_' + Date.now()
    });

    this.renderAll();
  }

  handleDestinationDeliver(orderId) {
    const idx = this.orders.findIndex(o => o.orderId === orderId);
    if (idx === -1) return;

    this.orders[idx] = MoveOrderService.confirmDestinationDelivery(this.orders[idx], {
      customerFinalSignature: 'SIG_FINAL_' + Date.now()
    });

    this.renderAll();
  }

  handleWhatsAppNotify(orderId) {
    const order = this.orders.find(o => o.orderId === orderId);
    if (!order) return;

    const url = WhatsAppBoxNotifierService.notifyMoveManifest({
      phone: order.customerPhone,
      customerName: order.customerName,
      orderId: order.orderId,
      bultosCount: order.items?.length || 0,
      totalM3: order.volumeSummary?.totalM3 || 0
    });
    window.open(url, '_blank');
  }

  renderDamagesGrid() {
    const grid = document.getElementById('damages-records-grid');
    if (!grid) return;

    const countBadge = document.getElementById('damages-count-badge');
    if (countBadge) countBadge.textContent = `${this.damages.length} actas`;

    if (this.damages.length === 0) {
      Sanitizer.safeSetInnerHTML(grid, '<div class="col-span-3 py-8 text-center text-[#7d8799]">No se han registrado daños previos. Todos los bienes ingresan en óptimas condiciones.</div>');
      return;
    }

    const cardsHtml = this.damages.map(d => `
      <div class="bg-[#13141a] border border-[#2b3140] rounded-xl p-4 space-y-3">
        <div class="flex items-center justify-between border-b border-[#2b3140]/80 pb-2">
          <span class="font-mono text-xs font-bold text-rose-400">${Sanitizer.escapeHTML(d.damageId)}</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
            ${Sanitizer.escapeHTML(d.damageLabel || d.damageType)}
          </span>
        </div>

        <div>
          <h4 class="font-bold text-sm text-white">${Sanitizer.escapeHTML(d.itemName)}</h4>
          <p class="text-xs text-[#9aa4b5] mt-0.5">Ubicación: <strong class="text-[#c8d0dc]">${Sanitizer.escapeHTML(d.locationOnItem)}</strong></p>
        </div>

        <p class="text-xs text-[#9aa4b5] bg-[#181a21]/60 p-2 rounded-lg border border-[#2b3140]/60 italic">
          "${Sanitizer.escapeHTML(d.description)}"
        </p>

        <div class="rounded-lg overflow-hidden border border-[#2b3140] h-28 bg-[#181a21] flex items-center justify-center relative">
          <img src="${Sanitizer.sanitizeURL(d.photoWitnessUrl)}" alt="Testigo fotográfico" class="w-full h-full object-cover">
          <span class="absolute bottom-1 right-1 text-[9px] bg-black/70 px-1.5 py-0.5 rounded text-[#c8d0dc] font-mono">
            Testigo Pericial 📸
          </span>
        </div>
      </div>
    `).join('');

    Sanitizer.safeSetInnerHTML(grid, cardsHtml);
  }

  renderInventorySelector() {
    const sel = document.getElementById('select-move-for-inventory');
    if (!sel) return;

    const optionsHtml = this.orders.map(m => `
      <option value="${Sanitizer.escapeHTML(m.orderId)}" ${m.orderId === this.selectedOrderId ? 'selected' : ''}>
        ${Sanitizer.escapeHTML(m.orderId)} - ${Sanitizer.escapeHTML(m.customerName)} (${Formatters.formatCubicMeters(m.volumeSummary?.totalM3)})
      </option>
    `).join('');

    Sanitizer.safeSetInnerHTML(sel, optionsHtml);
  }

  renderInventoryTable() {
    const container = document.getElementById('bultos-table-container');
    if (!container) return;

    const order = this.orders.find(o => o.orderId === this.selectedOrderId);
    if (!order || !order.items || order.items.length === 0) {
      Sanitizer.safeSetInnerHTML(container, '<div class="py-6 text-center text-[#7d8799]">Seleccione una mudanza para visualizar los bultos rotulados con QR.</div>');
      return;
    }

    const tableHtml = `
      <table class="w-full text-left text-xs text-[#c8d0dc]">
        <thead class="text-[#9aa4b5] border-b border-[#2b3140] text-[11px] uppercase tracking-wider font-mono">
          <tr>
            <th class="pb-2">Rótulo QR</th>
            <th class="pb-2">Ítem Inventariado</th>
            <th class="pb-2">Ambiente</th>
            <th class="pb-2">Carga en Origen</th>
            <th class="pb-2">Descarga en Destino</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60 font-sans">
          ${order.items.map(b => `
            <tr class="hover:bg-slate-800/40 transition">
              <td class="py-2.5 font-mono font-bold text-[#fbbf24] flex items-center gap-2">
                <span>📦</span>
                <span>${Sanitizer.escapeHTML(b.bultoCode)}</span>
              </td>
              <td class="py-2.5 font-medium text-white">${Sanitizer.escapeHTML(b.name)}</td>
              <td class="py-2.5 text-[#9aa4b5]">${Sanitizer.escapeHTML(b.room || 'General')}</td>
              <td class="py-2.5">
                <span class="inline-flex items-center gap-1 text-[11px] font-semibold ${b.loadedInTruck ? 'text-emerald-400' : 'text-[#7d8799]'}">
                  ${b.loadedInTruck ? '✔ Estibado' : '⏳ Pendiente'}
                </span>
              </td>
              <td class="py-2.5">
                <span class="inline-flex items-center gap-1 text-[11px] font-semibold ${b.deliveredInDestination ? 'text-emerald-400' : 'text-[#7d8799]'}">
                  ${b.deliveredInDestination ? '✔ Entregado' : '⏳ En Tránsito'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    Sanitizer.safeSetInnerHTML(container, tableHtml);
  }

  renderStorageCards() {
    const container = document.getElementById('storage-contracts-container');
    if (!container) return;

    if (this.contracts.length === 0) {
      Sanitizer.safeSetInnerHTML(container, '<div class="col-span-3 py-8 text-center text-[#7d8799]">No hay contratos de bauleras activos.</div>');
      return;
    }

    const cardsHtml = this.contracts.map(c => {
      const dunning = c.currentDunning || {};
      const badge = Formatters.formatStorageStatusBadge(dunning.stage);
      const isBlocked = !dunning.accessPinAllowed;

      return `
        <div class="bg-[#13141a] border border-[#2b3140] rounded-xl p-4 space-y-3 shadow-md">
          <div class="flex items-center justify-between border-b border-[#2b3140]/80 pb-2">
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-base text-emerald-400">${Sanitizer.escapeHTML(c.unitCode)}</span>
              <span class="${badge.badgeClass}">${badge.label}</span>
            </div>
            <span class="text-xs font-mono text-[#9aa4b5]">${Formatters.formatCubicMeters(c.capacityM3)}</span>
          </div>

          <div>
            <h4 class="font-bold text-sm text-white">${Sanitizer.escapeHTML(c.customerName)}</h4>
            <p class="text-xs text-[#9aa4b5] mt-0.5">Vencimiento: <strong class="text-slate-200 font-mono">${Formatters.formatDate(c.nextDueDate)}</strong></p>
          </div>

          <div class="grid grid-cols-2 gap-2 text-[11px] bg-[#181a21]/60 p-2.5 rounded-lg border border-[#2b3140]/50">
            <div>
              <span class="text-[#7d8799] block">Alquiler Mensual</span>
              <span class="font-mono font-semibold text-slate-200">${Formatters.formatCurrencyArs(c.monthlyFeeArs)}</span>
            </div>
            <div>
              <span class="text-[#7d8799] block">Días de Atraso</span>
              <span class="font-mono font-bold ${dunning.daysOverdue > 0 ? 'text-rose-400' : 'text-emerald-400'}">
                ${dunning.daysOverdue || 0} días
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between bg-[#181a21]/80 p-2 rounded-lg border border-[#2b3140] text-xs">
            <span class="text-[#9aa4b5]">Estado de Acceso:</span>
            <span class="font-mono font-extrabold ${isBlocked ? 'text-rose-400' : 'text-cyan-400'}">
              ${isBlocked ? '⛔ PIN BLOQUEADO' : '🔑 PIN HABILITADO'}
            </span>
          </div>

          ${dunning.penaltyAmount > 0 ? `
            <div class="text-[11px] bg-rose-500/10 text-rose-300 p-2 rounded border border-rose-500/20 flex items-center justify-between">
              <span>Recargo por Mora:</span>
              <span class="font-mono font-bold">${Formatters.formatCurrencyArs(dunning.penaltyAmount)}</span>
            </div>
          ` : ''}

          <div class="pt-2 border-t border-[#2b3140]/60 flex justify-end">
            <button class="btn-wa-storage px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[#c8d0dc] text-xs flex items-center gap-1.5" data-contract-id="${Sanitizer.escapeHTML(c.contractId)}">
              <span>💬</span> <span>Aviso WhatsApp de Cobranza</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    Sanitizer.safeSetInnerHTML(container, cardsHtml);

    // Bind Storage WhatsApp Button
    container.querySelectorAll('.btn-wa-storage').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-contract-id');
        const contract = this.contracts.find(c => c.contractId === id);
        if (contract) {
          const url = WhatsAppBoxNotifierService.notifyStorageRent({
            phone: contract.customerPhone,
            customerName: contract.customerName,
            unitCode: contract.unitCode,
            totalToPay: (contract.monthlyFeeArs || 0) + (contract.currentDunning?.penaltyAmount || 0),
            status: contract.currentDunning?.stage
          });
          window.open(url, '_blank');
        }
      });
    });
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new BoxTrackApp();
  app.init();
});
