import { VolumeCalculator } from '../core/volumeCalculator.js';
import { DamagePreInspectionEngine } from '../core/damagePreInspectionEngine.js';
import { CryptoSeal } from '../utils/cryptoSeal.js';

export class MoveOrderService {
  /**
   * Crea una orden de mudanza con inventario y cubicaje
   */
  static createOrder({
    customerId,
    customerName,
    customerPhone,
    originAddress,
    destinationAddress,
    scheduledDate,
    items = [], // Array de { tag, name, type, quantity, room, isFragile }
    damages = [], // Array de daños previos
    storageUnitId = null, // Si va a baulera intermedia
    pricing = { totalAmount: 180000, depositPaid: 50000 }
  }) {
    if (!customerId || !customerName || !originAddress || !destinationAddress) {
      throw new Error('Faltan datos obligatorios para crear la orden de mudanza');
    }

    const orderId = `MOV-${Date.now().toString(36).slice(-4)}-${Math.random().toString(36).slice(2, 6)}`;
    const createdAt = new Date().toISOString();

    // Calcular volumen total
    const volumeSummary = VolumeCalculator.calculateTotalM3(items);

    // Asignar etiquetas y códigos QR a cada bulto
    const taggedItems = items.map((it, idx) => {
      const bultoCode = `${orderId}-B${String(idx + 1).padStart(3, '0')}`;
      return {
        ...it,
        bultoCode,
        qrPayload: `BOXTRACK://${orderId}/${bultoCode}`,
        loadedInTruck: false,
        deliveredInDestination: false
      };
    });

    const riskEvaluation = DamagePreInspectionEngine.evaluateRiskLevel(damages);

    const total = Number(pricing.totalAmount) || 0;
    const deposit = Number(pricing.depositPaid) || 0;
    const balanceDue = Math.max(0, total - deposit);

    return {
      orderId,
      customerId,
      customerName,
      customerPhone: String(customerPhone || '').trim(),
      originAddress,
      destinationAddress,
      scheduledDate,
      createdAt,
      status: 'PRESUPUESTADO', // PRESUPUESTADO, CARGA_EN_ORIGEN, EN_TRANSITO, EN_BAULERA_STORAGE, DELIVERED_CONFIRMED
      volumeSummary,
      items: taggedItems,
      damages,
      riskEvaluation,
      storageUnitId,
      pricing: {
        totalAmount: total,
        depositPaid: deposit,
        balanceDue
      },
      originSignature: null,
      destinationSignature: null,
      cryptoSeal: null
    };
  }

  /**
   * Registra el cierre de carga en origen con doble firma ePOD y Sello SHA-256
   */
  static sealOriginLoading(order, { crewLeaderName, customerSignature, crewSignature }) {
    if (!order) throw new Error('Orden no especificada');
    if (!customerSignature || !crewSignature) {
      throw new Error('Se requiere la doble firma ePOD (Responsable de Cuadrilla y Cliente en Origen)');
    }

    const loadedAt = new Date().toISOString();

    // Marcar todos los bultos como cargados
    const items = order.items.map(it => ({ ...it, loadedInTruck: true }));

    const updated = {
      ...order,
      status: order.storageUnitId ? 'EN_BAULERA_STORAGE' : 'EN_TRANSITO',
      items,
      originSignature: {
        crewLeaderName,
        crewSignature,
        customerSignature,
        loadedAt
      }
    };

    // Sello Criptográfico Inmutable SHA-256
    const sealPayload = {
      orderId: updated.orderId,
      customerId: updated.customerId,
      originAddress: updated.originAddress,
      destinationAddress: updated.destinationAddress,
      bultosCount: updated.items.length,
      damagesCount: updated.damages.length,
      signatures: {
        crew: crewSignature,
        cust: customerSignature
      },
      loadedAt
    };

    updated.cryptoSeal = CryptoSeal.generate(sealPayload);
    return updated;
  }

  /**
   * Registra la entrega final en destino con firma en conformidad y saldo cancelado
   */
  static confirmDestinationDelivery(order, { customerFinalSignature, finalPayment = null }) {
    if (!order) throw new Error('Orden no especificada');
    if (!order.cryptoSeal) {
      throw new Error('La orden debe estar sellada en origen antes de confirmar la entrega');
    }
    if (!customerFinalSignature) {
      throw new Error('Se requiere la firma del cliente en conformidad de la descarga');
    }

    const deliveredAt = new Date().toISOString();
    const paid = finalPayment !== null ? Number(finalPayment) : order.pricing.balanceDue;

    const items = order.items.map(it => ({ ...it, deliveredInDestination: true }));

    return {
      ...order,
      status: 'DELIVERED_CONFIRMED',
      items,
      pricing: {
        ...order.pricing,
        balanceDue: Math.max(0, order.pricing.balanceDue - paid)
      },
      destinationSignature: {
        customerFinalSignature,
        deliveredAt,
        conformityWithoutNewDamage: true
      }
    };
  }

  /**
   * Verifica la autenticidad e integridad del acta de carga
   */
  static verifyOrderSeal(order) {
    if (!order || !order.cryptoSeal || !order.originSignature) return false;

    const sealPayload = {
      orderId: order.orderId,
      customerId: order.customerId,
      originAddress: order.originAddress,
      destinationAddress: order.destinationAddress,
      bultosCount: order.items.length,
      damagesCount: order.damages.length,
      signatures: {
        crew: order.originSignature.crewSignature,
        cust: order.originSignature.customerSignature
      },
      loadedAt: order.originSignature.loadedAt
    };

    return CryptoSeal.verify(sealPayload, order.cryptoSeal);
  }
}
