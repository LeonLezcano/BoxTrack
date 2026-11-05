/**
 * Sentinel de Mora Progresiva & Bloqueo de Acceso a Bauleras
 * AiAppFactory Engine #223 Standard
 */
export const STORAGE_UNITS_CATALOG = {
  MINI_5: { id: 'MINI_5', name: 'Box Mini (2 m² / 5 m³)', monthlyFeeArs: 45000, capacityM3: 5 },
  MEDIUM_15: { id: 'MEDIUM_15', name: 'Box Mediano (6 m² / 15 m³)', monthlyFeeArs: 95000, capacityM3: 15 },
  LARGE_30: { id: 'LARGE_30', name: 'Box Grande (12 m² / 30 m³)', monthlyFeeArs: 160000, capacityM3: 30 },
  CONTAINER_75: { id: 'CONTAINER_75', name: 'Nave / Contenedor (30 m² / 75 m³)', monthlyFeeArs: 320000, capacityM3: 75 }
};

export class StorageDunningSentinel {
  /**
   * Evalúa la situación de cobro y mora de un contrato de baulera
   * @param {string|Date} dueDate Fecha de vencimiento de alquiler
   * @param {number} monthlyFee Canon mensual pactado
   * @param {number} lateFeeDailyPercent Porcentaje diario de recargo por mora (default 0.5%)
   */
  static evaluateDunning(dueDate, monthlyFee = 45000, lateFeeDailyPercent = 0.5) {
    if (!dueDate) {
      return { status: 'DISPONIBLE', daysOverdue: 0, penaltyAmount: 0, totalToPay: 0, accessGranted: true };
    }

    const dueTime = new Date(dueDate).getTime();
    const now = Date.now();
    const diffMs = now - dueTime;
    const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    let status = 'OCUPADO_AL_DIA';
    let accessGranted = true;
    let actionRequired = 'Ninguna. Alquiler al día.';

    if (daysOverdue > 30) {
      status = 'INTIMACION_REMATE';
      accessGranted = false;
      actionRequired = 'Intimación fehaciente por carta documento / WhatsApp legal previo a desalojo y remate.';
    } else if (daysOverdue > 15) {
      status = 'ACCESO_BLOQUEADO';
      accessGranted = false;
      actionRequired = 'Inhabilitación de PIN y tarjeta de acceso al portón del depósito.';
    } else if (daysOverdue > 5) {
      status = 'EN_MORA_AVISO';
      accessGranted = true;
      actionRequired = 'Envío de recordatorio amistoso de pago por WhatsApp.';
    }

    // Cálculo de punitorios
    const penaltyRate = (daysOverdue * lateFeeDailyPercent) / 100;
    const penaltyAmount = Number((monthlyFee * penaltyRate).toFixed(2));
    const totalToPay = Number((monthlyFee + penaltyAmount).toFixed(2));

    return {
      status,
      daysOverdue,
      monthlyFee,
      penaltyAmount,
      totalToPay,
      accessGranted,
      actionRequired,
      evaluatedAt: new Date().toISOString()
    };
  }
}
