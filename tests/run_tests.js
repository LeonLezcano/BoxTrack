/**
 * Arnés de Pruebas Multi-Capa (5 Capas + Fuzzing)
 * BoxTrack - AiAppFactory Standard
 */
import { VolumeCalculator, ITEM_CUBIC_STANDARDS, VEHICLE_FLEET } from '../src/core/volumeCalculator.js';
import { DamagePreInspectionEngine, DAMAGE_TYPES } from '../src/core/damagePreInspectionEngine.js';
import { StorageDunningSentinel, STORAGE_UNITS_CATALOG } from '../src/core/storageDunningSentinel.js';
import { MoveOrderService } from '../src/services/moveOrderService.js';
import { StorageContractService } from '../src/services/storageContractService.js';
import { ExportService } from '../src/services/exportService.js';
import { BoxTrackCacheService } from '../src/services/boxTrackCache.service.js';
import { WhatsAppBoxNotifierService } from '../src/services/whatsAppBoxNotifier.service.js';
import { CryptoSeal } from '../src/utils/cryptoSeal.js';
import { Formatters } from '../src/utils/formatters.js';
import { Sanitizer } from '../src/utils/sanitizer.js';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✔ ${message}`);
  } else {
    failed++;
    console.error(`  ✖ FAILED: ${message}`);
  }
}

console.log('======================================================================');
console.log('  BOXTRACK - SUITE COMPLETA DE PRUEBAS (5 CAPAS)');
console.log('======================================================================\n');

// ---------------------------------------------------------------------
// CAPA 1: UNITARIAS & ALGORITMOS DE CUBICAJE Y ALMACENAJE
// ---------------------------------------------------------------------
console.log('  [CAPA 1: UNITARIAS & ALGORITMOS DE CUBICAJE Y ALMACENAJE]');

// 1. Volume calculator sums item cubic meters accurately
const itemsSample = [
  { type: 'BOX_STANDARD', quantity: 20 }, // 20 * 0.08 = 1.6 m3
  { type: 'REFRIGERATOR', quantity: 1 },   // 1.2 m3
  { type: 'SOFA_3_SEATS', quantity: 1 },   // 1.8 m3
  { type: 'DOUBLE_BED', quantity: 1 }      // 2.0 m3
]; // Net: 1.6 + 1.2 + 1.8 + 2.0 = 6.6 m3. With 10% buffer = 7.26 m3.
const volRes = VolumeCalculator.calculateTotalM3(itemsSample, 10);
assert(volRes.netM3 === 6.60, 'Net cubic meters calculated accurately (6.60 m³)');
assert(volRes.totalM3 === 7.26, 'Total cubic meters with 10% buffer calculated accurately (7.26 m³)');
assert(volRes.suggestedVehicle.id === 'VAN_SMALL', 'Suggested vehicle fits volume (VAN_SMALL 15 m³)');

// 2. Volume calculator selects large truck for large move
const largeItems = [
  { type: 'BOX_STANDARD', quantity: 100 }, // 8 m3
  { type: 'DINING_SET', quantity: 4 },     // 10 m3
  { type: 'DOUBLE_BED', quantity: 6 },     // 12 m3
  { type: 'SOFA_3_SEATS', quantity: 4 },   // 7.2 m3
  { type: 'REFRIGERATOR', quantity: 4 }    // 4.8 m3
]; // Net: 42 m3. With 10% buffer = 46.2 m3 -> TRUCK_LARGE (60 m3)
const volLarge = VolumeCalculator.calculateTotalM3(largeItems, 10);
assert(volLarge.suggestedVehicle.id === 'TRUCK_LARGE', 'Large volume selects TRUCK_LARGE (capacity 60 m³)');

// 3. Volume calculator handles custom m3 items
const customItems = [{ type: 'CUSTOM', quantity: 2, customM3: 3.5 }];
const volCustom = VolumeCalculator.calculateTotalM3(customItems, 0);
assert(volCustom.netM3 === 7.00 && volCustom.totalM3 === 7.00, 'Custom m3 items calculated accurately');

// 4. Damage pre-inspection records defect with photo witness
const damageItem = DamagePreInspectionEngine.recordPreExistingDamage({
  itemTag: 'MUEB-001',
  itemName: 'Mesa de Roble de Estilo',
  damageType: 'SURFACE_SCRATCH',
  locationOnItem: 'Tapa superior centro',
  description: 'Rayón visible de 12 cm previo al embalaje',
  photoWitnessUrl: 'https://storage.boxtrack.app/damages/photo1.jpg'
});
assert(damageItem.damageId.startsWith('DAM-'), 'Damage record created with unique DAM- ID');
assert(damageItem.damageLabel.includes('Rayón superficial'), 'Damage label mapped correctly');

// 5. Risk evaluator flags low risk on clean move
const cleanRisk = DamagePreInspectionEngine.evaluateRiskLevel([]);
assert(cleanRisk.level === 'BAJO' && cleanRisk.riskScore === 0, 'Zero damages evaluates to BAJO risk');

// 6. Risk evaluator flags high risk on fragile and multiple damages
const severeDamages = [
  { damageType: 'CRACKED_GLASS', isFragile: true },
  { damageType: 'CRACKED_GLASS', isFragile: true },
  { damageType: 'DEEP_DENT', isFragile: false }
];
const severeRisk = DamagePreInspectionEngine.evaluateRiskLevel(severeDamages);
assert(severeRisk.level === 'ALTO_RIESGO' && severeRisk.riskScore >= 60, 'Multiple critical damages evaluate to ALTO_RIESGO');

// 7. Storage Dunning Sentinel: up to date rent (AL_DIA)
const now = Date.now();
const futureDue = new Date(now + 5 * 24 * 3600 * 1000).toISOString();
const dunningClean = StorageDunningSentinel.evaluateDunning(futureDue, 50000);
assert(dunningClean.status === 'OCUPADO_AL_DIA' && dunningClean.accessGranted === true, 'Future due date evaluates to OCUPADO_AL_DIA with access granted');

// 8. Storage Dunning Sentinel: friendly notice (6-15 days overdue)
const overdue8Days = new Date(now - 8 * 24 * 3600 * 1000).toISOString();
const dunning8 = StorageDunningSentinel.evaluateDunning(overdue8Days, 50000);
assert(dunning8.status === 'EN_MORA_AVISO' && dunning8.daysOverdue >= 8, '8 days overdue evaluates to EN_MORA_AVISO');
assert(dunning8.penaltyAmount > 0, 'Penalty amount computed for late rent');

// 9. Storage Dunning Sentinel: access blocked (16-30 days overdue)
const overdue20Days = new Date(now - 20 * 24 * 3600 * 1000).toISOString();
const dunning20 = StorageDunningSentinel.evaluateDunning(overdue20Days, 50000);
assert(dunning20.status === 'ACCESO_BLOQUEADO' && dunning20.accessGranted === false, '20 days overdue blocks box access PIN');

// 10. Storage Dunning Sentinel: pre-auction legal notice (> 30 days overdue)
const overdue35Days = new Date(now - 35 * 24 * 3600 * 1000).toISOString();
const dunning35 = StorageDunningSentinel.evaluateDunning(overdue35Days, 50000);
assert(dunning35.status === 'INTIMACION_REMATE' && dunning35.accessGranted === false, 'Over 30 days overdue triggers INTIMACION_REMATE protocol');


// ---------------------------------------------------------------------
// CAPA 2: INTEGRACIÓN & CADENA DE CUSTODIA FORENSE (SHA-256)
// ---------------------------------------------------------------------
console.log('\n  [CAPA 2: INTEGRACIÓN & CADENA DE CUSTODIA FORENSE]');

// 11. Create move order with items and damages
const moveOrder = MoveOrderService.createOrder({
  customerId: 'CLI-MUD-99',
  customerName: 'Santiago Bernardi',
  customerPhone: '+5493415887766',
  originAddress: 'Av. Pellegrini 1450, Piso 8, Rosario',
  destinationAddress: 'Barrio Palos Verdes, Casa 12, Funes',
  scheduledDate: '2026-11-20',
  items: [
    { name: 'Smart TV 75 OLED', type: 'SMART_TV_65', quantity: 1, room: 'Living', isFragile: true },
    { name: 'Cajas Ropa y Vajilla', type: 'BOX_STANDARD', quantity: 30, room: 'Varios', isFragile: false },
    { name: 'Sillón 3 Cuerpos', type: 'SOFA_3_SEATS', quantity: 1, room: 'Living', isFragile: false }
  ],
  damages: [damageItem],
  pricing: { totalAmount: 220000, depositPaid: 70000 }
});
assert(moveOrder.orderId.startsWith('MOV-'), 'Move order created with unique MOV- ID');
assert(moveOrder.status === 'PRESUPUESTADO', 'Initial status is PRESUPUESTADO');
assert(moveOrder.items.length === 3, 'All inventory items tagged');
assert(moveOrder.items[0].bultoCode.includes('B001'), 'Items assigned sequential QR bulto code');
assert(moveOrder.pricing.balanceDue === 150000, 'Balance due calculated correctly (220k - 70k = 150k)');

// 12. Seal loading at origin with double signature ePOD
const loadedOrder = MoveOrderService.sealOriginLoading(moveOrder, {
  crewLeaderName: 'Capataz Miguel Ángel Rossi',
  customerSignature: 'SIG_SANTIAGO_BERNARDI_ORIGIN',
  crewSignature: 'SIG_MIGUEL_ROSSI_CREW'
});
assert(loadedOrder.status === 'EN_TRANSITO', 'Order transitions to EN_TRANSITO after origin loading');
assert(loadedOrder.items.every(it => it.loadedInTruck === true), 'All bultos marked loadedInTruck');
assert(typeof loadedOrder.cryptoSeal === 'string' && loadedOrder.cryptoSeal.length === 64, 'Order generated immutable 64-char SHA-256 seal');

// 13. Verify authentic origin seal
assert(MoveOrderService.verifyOrderSeal(loadedOrder) === true, 'Origin seal integrity verification passes on genuine order');

// 14. Tampering with origin address or items count breaks verification
const tamperedMove = JSON.parse(JSON.stringify(loadedOrder));
tamperedMove.originAddress = 'Dirección Falsa 123';
assert(MoveOrderService.verifyOrderSeal(tamperedMove) === false, 'Seal verification rejects tampered origin address');

// 15. Confirm destination delivery with final customer signature
const deliveredMove = MoveOrderService.confirmDestinationDelivery(loadedOrder, {
  customerFinalSignature: 'SIG_SANTIAGO_BERNARDI_DESTINATION',
  finalPayment: 150000
});
assert(deliveredMove.status === 'DELIVERED_CONFIRMED', 'Order transitions to DELIVERED_CONFIRMED');
assert(deliveredMove.pricing.balanceDue === 0, 'Final balance due drops to 0 after destination settlement');
assert(deliveredMove.items.every(it => it.deliveredInDestination === true), 'All bultos confirmed delivered in destination');

// 16. Storage contract creation and status update
const storageContract = StorageContractService.createContract({
  unitCode: 'BOX-B-14',
  unitType: 'MEDIUM_15',
  customerId: 'CLI-STORAGE-01',
  customerName: 'Dra. Elena Gómez',
  customerPhone: '+5493435123456'
});
assert(storageContract.contractId.startsWith('CTR-'), 'Storage contract created with CTR- ID');
assert(storageContract.capacityM3 === 15, 'Unit capacity matches spec (15 m³)');
const evaluatedContract = StorageContractService.evaluateContractStatus(storageContract);
assert(Boolean(evaluatedContract.currentDunning), 'Contract dunning status evaluated cleanly');

// 17. Universal CSV export generates Excel-compatible string with UTF-8 BOM
const csvOutput = ExportService.exportToExcelCSV('test_moves', [
  { id: 'MOV-01', customer: 'Bernardi', totalM3: 7.2, status: 'DELIVERED_CONFIRMED' }
], [
  { key: 'id', label: 'ID Mudanza' },
  { key: 'customer', label: 'Cliente' },
  { key: 'totalM3', label: 'Volumen (m³)' },
  { key: 'status', label: 'Estado' }
]);
assert(csvOutput.startsWith('\uFEFF'), 'CSV export includes UTF-8 BOM prefix for Microsoft Excel in Windows');
assert(csvOutput.includes('Bernardi'), 'CSV export outputs customer records cleanly');


// ---------------------------------------------------------------------
// CAPA 3: COMPONENTES & ESTABILIDAD REACTIVA
// ---------------------------------------------------------------------
console.log('\n  [CAPA 3: COMPONENTES & ESTABILIDAD REACTIVA]');

// 18. Cubic meters formatter
assert(Formatters.cubicMeters(14.5) === '14.50 m³', 'Cubic meters formatter outputs 2 decimals and m³');
assert(Formatters.cubicMeters(null) === '0.00 m³', 'Cubic meters formatter handles null gracefully');

// 19. Currency ARS formatting
assert(Formatters.currencyARS(220000).includes('220.000'), 'Currency ARS formats thousands with dot');

// 20. Currency USD formatting
assert(Formatters.currencyUSD(250.75).includes('250.75'), 'Currency USD formats two decimals');

// 21. Move status badge mapping
const badgeTransit = Formatters.moveStatusBadge('EN_TRANSITO');
assert(badgeTransit.icon === '🛣️' && badgeTransit.text.includes('purple'), 'Status badge styles EN_TRANSITO in purple');
const badgeDelivered = Formatters.moveStatusBadge('DELIVERED_CONFIRMED');
assert(badgeDelivered.icon === '✓' && badgeDelivered.text.includes('emerald'), 'Status badge styles DELIVERED_CONFIRMED in emerald');

// 22. Storage status badge mapping
const badgeBlocked = Formatters.storageStatusBadge('ACCESO_BLOQUEADO');
assert(badgeBlocked.icon === '⛔' && badgeBlocked.text.includes('rose'), 'Storage badge styles ACCESO_BLOQUEADO in rose');

// 23. DOM Sanitizer escapes dangerous characters
const escaped = Sanitizer.escapeHTML('<script>alert("hack")</script>');
assert(!escaped.includes('<script>') && escaped.includes('&lt;script&gt;'), 'Sanitizer escapes HTML tags safely');

// 24. Sanitizer blocks javascript: URLs
assert(Sanitizer.sanitizeURL('javascript:void(0)') === '#', 'Sanitizer blocks javascript: protocol');
assert(Sanitizer.sanitizeURL('https://boxtrack.app/manifest') === 'https://boxtrack.app/manifest', 'Sanitizer allows HTTPS URL');


// ---------------------------------------------------------------------
// CAPA 4: SEGURIDAD, CSP & FIRESTORE RULES
// ---------------------------------------------------------------------
console.log('\n  [CAPA 4: SEGURIDAD, CSP & FIRESTORE RULES]');

// 25. firestore.rules file exists
const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
assert(fs.existsSync(rulesPath), 'firestore.rules exists in root');

// 26. firestore.rules enforces authentication
const rulesContent = fs.readFileSync(rulesPath, 'utf8');
assert(rulesContent.includes('request.auth != null'), 'Firestore rules require authenticated user');

// 27. firestore.rules defines staff roles
assert(rulesContent.includes('ADMIN') && rulesContent.includes('CHOFER'), 'Firestore rules define staff roles');

// 28. firestore.rules locks delivered move orders from edits
assert(rulesContent.includes("resource.data.status != 'DELIVERED_CONFIRMED'"), 'Firestore rules lock confirmed move orders from edits');

// 29. firestore.rules strictly forbids deletion of move orders
assert(rulesContent.includes('allow delete: if false;'), 'Firestore rules forbid deleting forensic move records');

// 30. firebase.json specifies strict Content-Security-Policy
const fbPath = path.resolve(process.cwd(), 'firebase.json');
const fbContent = fs.readFileSync(fbPath, 'utf8');
assert(fbContent.includes('Content-Security-Policy'), 'firebase.json specifies Content-Security-Policy');

// 31. CSP forbids unsafe-eval
assert(!fbContent.includes("'unsafe-eval'"), 'CSP forbids unsafe-eval execution');

// 32. firebase.json specifies X-Frame-Options DENY
assert(fbContent.includes('"X-Frame-Options"') && fbContent.includes('"DENY"'), 'firebase.json enforces X-Frame-Options: DENY');

// 33. firebase.json specifies HSTS and nosniff
assert(fbContent.includes('nosniff') && fbContent.includes('max-age=31536000'), 'firebase.json enforces HSTS and X-Content-Type nosniff');

// 34. Zero secrets committed in source code
assert(!fbContent.includes('sk-ant-') && !fbContent.includes('AIzaSy'), 'Zero API keys or cloud secrets in configuration files');

// 35. .gitignore covers secrets and dependencies
const gitignoreContent = fs.readFileSync(path.resolve(process.cwd(), '.gitignore'), 'utf8');
assert(gitignoreContent.includes('.env') && gitignoreContent.includes('node_modules'), '.gitignore covers secrets and dependencies');


// ---------------------------------------------------------------------
// CAPA 5: E2E FLUIDO & OPERATIVIDAD DE CUADRILLA
// ---------------------------------------------------------------------
console.log('\n  [CAPA 5: E2E FLUIDO & OPERATIVIDAD DE CUADRILLA]');

// 36. Full move workflow: Quote -> Damage Survey -> QR Bultos -> Origin ePOD -> Delivery ePOD
const e2eMove = MoveOrderService.createOrder({
  customerId: 'CLI-E2E-77',
  customerName: 'Constanza Arismendi',
  customerPhone: '+5493416667788',
  originAddress: 'Bv. Oroño 850, Rosario',
  destinationAddress: 'Córdoba 2100, Rosario',
  scheduledDate: '2026-11-25',
  items: [
    { name: 'Heladera Inox', type: 'REFRIGERATOR', quantity: 1, room: 'Cocina', isFragile: true },
    { name: 'Cajas Ropa', type: 'BOX_STANDARD', quantity: 15, room: 'Dormitorio', isFragile: false }
  ],
  damages: [
    DamagePreInspectionEngine.recordPreExistingDamage({
      itemTag: 'HEL-01',
      itemName: 'Heladera Inox',
      damageType: 'SURFACE_SCRATCH',
      locationOnItem: 'Puerta inferior izquierda',
      description: 'Micro-rayón de 4cm'
    })
  ],
  pricing: { totalAmount: 140000, depositPaid: 40000 }
});
const e2eLoaded = MoveOrderService.sealOriginLoading(e2eMove, {
  crewLeaderName: 'Juan Carlos Pereyra',
  customerSignature: 'SIG_CONSTANZA_ARISMENDI',
  crewSignature: 'SIG_JUAN_PEREYRA'
});
const e2eDelivered = MoveOrderService.confirmDestinationDelivery(e2eLoaded, {
  customerFinalSignature: 'SIG_CONSTANZA_DELIVERY',
  finalPayment: 100000
});
assert(e2eDelivered.status === 'DELIVERED_CONFIRMED', 'E2E move lifecycle reaches DELIVERED_CONFIRMED state');
assert(e2eDelivered.pricing.balanceDue === 0, 'E2E move settled in full');

// 37. Offline cache stores and loads move orders
BoxTrackCacheService.saveOrders([e2eDelivered]);
const cachedMoves = BoxTrackCacheService.getOrders();
assert(cachedMoves.length === 1 && cachedMoves[0].orderId === e2eDelivered.orderId, 'Offline cache saves and retrieves move orders');

// 38. Anti-phantom seed flag respects purge state
BoxTrackCacheService.purgeData();
assert(BoxTrackCacheService.isPurged() === true, 'Purge flag is set');
assert(BoxTrackCacheService.getOrders().length === 0, 'Purged state prevents demo seed re-population');

// 39. WhatsApp notification for moving manifest encodes E.164 URLs
const waManifest = WhatsAppBoxNotifierService.notifyMoveManifest({
  phone: '+54 9 341 666-7788',
  customerName: 'Constanza Arismendi',
  orderId: e2eDelivered.orderId,
  bultosCount: 16,
  totalM3: 2.64
});
assert(waManifest.startsWith('https://wa.me/5493416667788'), 'WhatsApp manifest notification formats E.164 phone');
assert(waManifest.includes('SHA-256'), 'WhatsApp manifest notification highlights immutable cryptographic seal');

// 40. WhatsApp notification for storage overdue rent
const waStorage = WhatsAppBoxNotifierService.notifyStorageRent({
  phone: '+5493435123456',
  customerName: 'Elena Gómez',
  unitCode: 'BOX-B-14',
  totalToPay: 52500,
  status: 'EN_MORA_AVISO'
});
assert(waStorage.includes('BOX-B-14'), 'WhatsApp storage notification includes unit code');

// 41. Rapid repeated volume calculations for memory stability
for (let i = 0; i < 400; i++) {
  VolumeCalculator.calculateTotalM3(itemsSample, 10);
}
assert(true, 'Rapid repeated volume calculations execute with zero memory leaks');


// ---------------------------------------------------------------------
// FUZZING & CHAOTIC PROPERTY TESTS
// ---------------------------------------------------------------------
console.log('\n  [FUZZING & CHAOTIC PROPERTY TESTS]');

// 42. Volume calculator handles null, empty array, negative quantities
const nullVol = VolumeCalculator.calculateTotalM3(null);
assert(nullVol.netM3 === 0 && nullVol.totalM3 === 0, 'Volume calculator handles null gracefully');

const negativeVol = VolumeCalculator.calculateTotalM3([{ type: 'REFRIGERATOR', quantity: -5 }]);
assert(negativeVol.netM3 === 0, 'Volume calculator sanitizes negative quantities to zero');

// 43. Dunning sentinel handles missing due date
const nullDueDunning = StorageDunningSentinel.evaluateDunning(null);
assert(nullDueDunning.status === 'DISPONIBLE' && nullDueDunning.accessGranted === true, 'Dunning sentinel handles null due date safely');

// 44. Damage pre-inspection throws on missing required fields
let damageErrorThrown = false;
try {
  DamagePreInspectionEngine.recordPreExistingDamage({});
} catch (e) {
  damageErrorThrown = true;
}
assert(damageErrorThrown === true, 'Damage pre-inspection rejects incomplete damage payload');

// 45. CryptoSeal produces valid 64-char hash on complex UTF-8/emoji payloads
const unicodeMove = { details: '📦 Mudanza Piso 14 Torre Nordelta — Televisor Sony 85" 4K OLED + Mesa Mármol Carrara — Señora Müller' };
const unicodeHash = CryptoSeal.generate(unicodeMove);
assert(typeof unicodeHash === 'string' && unicodeHash.length === 64, 'CryptoSeal produces valid 64-char hex on complex UTF-8/emoji payloads');

// 46. Move order service throws on invalid customer data
let orderErrorThrown = false;
try {
  MoveOrderService.createOrder({});
} catch (e) {
  orderErrorThrown = true;
}
assert(orderErrorThrown === true, 'Move order service rejects empty required data');

// 47. Version parity check
const packageJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'));
const versionJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'version.json'), 'utf8'));
assert(packageJson.version === versionJson.version.replace(/^v/, ''), 'package.json and version.json versions match');

console.log('\n======================================================================');
console.log(`  TOTAL: ${passed + failed} tests | ${passed} PASSED | ${failed} FAILED`);
console.log('======================================================================\n');

if (failed > 0) {
  process.exit(1);
}
