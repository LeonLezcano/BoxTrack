/**
 * Motor de Peritaje Visual de Daños Preexistentes
 * AiAppFactory Engine #115 & #131 Standard
 */
export const DAMAGE_TYPES = {
  SURFACE_SCRATCH: 'Rayón superficial / Raspón de lustre',
  DEEP_DENT: 'Hendidura profunda / Golpe estructural',
  CHIPPED_CORNER: 'Esquina descascarada / Desportillado',
  CRACKED_GLASS: 'Vidrio / Pantalla rajada o fisurada',
  FABRIC_STAIN_TEAR: 'Mancha preexistente / Desgarro en tapizado',
  LOOSE_JOINT: 'Pata / Unión descolada o tambaleante'
};

export class DamagePreInspectionEngine {
  /**
   * Registra un peritaje visual de daño preexistente en origen
   */
  static recordPreExistingDamage({
    itemTag,
    itemName,
    damageType,
    locationOnItem,
    description,
    photoWitnessUrl = 'data:image/svg+xml;base64,witnessPhoto',
    isFragile = false
  }) {
    if (!itemTag || !itemName || !damageType) {
      throw new Error('Faltan datos obligatorios para registrar el peritaje de daño previo');
    }

    return {
      damageId: `DAM-${Date.now().toString(36).slice(-4)}-${Math.random().toString(36).slice(2, 6)}`,
      itemTag,
      itemName,
      damageType,
      damageLabel: DAMAGE_TYPES[damageType] || damageType,
      locationOnItem: locationOnItem || 'Frente / Lateral',
      description: description || 'Detalle visual observado en origen antes de embalar',
      photoWitnessUrl,
      isFragile: Boolean(isFragile),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Evalúa el nivel de riesgo de la mudanza en base al inventario de daños
   */
  static evaluateRiskLevel(damages = []) {
    if (!Array.isArray(damages) || damages.length === 0) {
      return { riskScore: 0, level: 'BAJO', summary: 'Mobiliario en excelente estado sin daños registrados' };
    }

    let score = damages.length * 10;
    const criticalDamages = damages.filter(d => d.damageType === 'CRACKED_GLASS' || d.isFragile);
    score += criticalDamages.length * 25;

    let level = 'MODERADO';
    if (score >= 60) level = 'ALTO_RIESGO';
    else if (score < 25) level = 'BAJO';

    return {
      riskScore: score,
      level,
      totalDamages: damages.length,
      criticalDamagesCount: criticalDamages.length,
      summary: `Registrados ${damages.length} daños preexistentes (${criticalDamages.length} críticos). Firma obligatoria requerida.`
    };
  }
}
