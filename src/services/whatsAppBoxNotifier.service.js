/**
 * WhatsApp Box Notifier Service
 * Enlaces directos E.164 para manifiestos de carga y avisos de bauleras
 */
export class WhatsAppBoxNotifierService {
  /**
   * Genera enlace de notificación de manifiesto de carga firmado
   */
  static notifyMoveManifest({ phone, customerName, orderId, bultosCount, totalM3 }) {
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    const text = `📦 *BoxTrack - Manifiesto de Mudanza Certificado* 📦\n\nEstimado/a *${customerName}*:\nSu mudanza orden *${orderId}* ha sido cargada en origen.\n\n📊 *Total Bultos Rotulados con QR:* ${bultosCount}\n📐 *Volumen Estimado:* ${totalM3} m³\n🔒 *Acta Forense con Fotos Testigo:* Sellada con SHA-256 inmutable.\n\nEl equipo viaja rumbo al destino.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  /**
   * Genera enlace de notificación de vencimiento / mora de baulera
   */
  static notifyStorageRent({ phone, customerName, unitCode, totalToPay, status }) {
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    const alertIcon = status === 'ACCESO_BLOQUEADO' ? '⛔' : status === 'EN_MORA_AVISO' ? '⚠️' : '📅';
    const text = `🏢 *BoxTrack Self-Storage - Estado de Baulera*\n\nEstimado/a *${customerName}*:\nLe informamos el estado de su box *${unitCode}*:\n\n${alertIcon} *Situación:* ${status}\n💰 *Monto a Regularizar:* $${totalToPay.toLocaleString('es-AR')}\n\nPara evitar el bloqueo de PIN o recargos por mora, rogamos informar su comprobante de pago.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }
}

export const WhatsAppBoxNotifier = WhatsAppBoxNotifierService;

