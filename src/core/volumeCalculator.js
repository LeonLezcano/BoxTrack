/**
 * Calculador Volumétrico de Mudanza y Cubicaje
 * AiAppFactory Standard
 */
export const ITEM_CUBIC_STANDARDS = {
  BOX_STANDARD: { name: 'Caja Estándar (Vajilla / Ropa)', m3: 0.08 },
  BOX_WARDROBE: { name: 'Caja Perchero de Ropa Colgada', m3: 0.35 },
  REFRIGERATOR: { name: 'Heladera Familiar / Freezer', m3: 1.20 },
  WASHING_MACHINE: { name: 'Lavarropas / Secarropas', m3: 0.50 },
  SOFA_3_SEATS: { name: 'Sillón 3 Cuerpos / Chaise Longue', m3: 1.80 },
  DINING_SET: { name: 'Juego de Comedor (Mesa + 6 Sillas)', m3: 2.50 },
  DOUBLE_BED: { name: 'Cama Matrimonial (Sommier + Respaldo)', m3: 2.00 },
  SMART_TV_65: { name: 'Smart TV / Monitor 65"+ (Crítica)', m3: 0.35 },
  OFFICE_DESK: { name: 'Escritorio de Oficina / Puesto de Trabajo', m3: 1.00 }
};

export const VEHICLE_FLEET = [
  { id: 'VAN_SMALL', name: 'Furgón Urbano Chico', capacityM3: 15 },
  { id: 'TRUCK_MEDIUM', name: 'Camión Mediano Mudancero', capacityM3: 35 },
  { id: 'TRUCK_LARGE', name: 'Camión Grande Chasis', capacityM3: 60 },
  { id: 'SEMI_TRAILER', name: 'Semirremolque Larga Distancia', capacityM3: 90 }
];

export class VolumeCalculator {
  /**
   * Calcula el volumen total de una lista de ítems de mudanza
   * @param {Array<{type: string, quantity: number, customM3?: number}>} items
   * @param {number} bufferPercentage Factor de estiba/embalaje (default 10%)
   */
  static calculateTotalM3(items = [], bufferPercentage = 10) {
    if (!Array.isArray(items)) return { netM3: 0, totalM3: 0, suggestedVehicle: VEHICLE_FLEET[0] };

    let netM3 = 0;
    items.forEach(it => {
      const qty = Math.max(0, Number(it.quantity) || 0);
      const unitM3 = it.customM3 !== undefined
        ? Number(it.customM3) || 0
        : (ITEM_CUBIC_STANDARDS[it.type]?.m3 || 0.1);
      netM3 += qty * unitM3;
    });

    const factor = 1 + (Number(bufferPercentage) || 0) / 100;
    const totalM3 = Number((netM3 * factor).toFixed(2));

    // Sugerencia de vehículo
    let suggestedVehicle = VEHICLE_FLEET[0];
    for (const v of VEHICLE_FLEET) {
      if (v.capacityM3 >= totalM3) {
        suggestedVehicle = v;
        break;
      }
      suggestedVehicle = v; // el mayor si excede
    }

    return {
      netM3: Number(netM3.toFixed(2)),
      totalM3,
      bufferPercentage,
      suggestedVehicle
    };
  }

  static suggestVehicle(totalM3 = 0) {
    let suggestedVehicle = VEHICLE_FLEET[0];
    for (const v of VEHICLE_FLEET) {
      if (v.capacityM3 >= totalM3) {
        return v;
      }
      suggestedVehicle = v;
    }
    return suggestedVehicle;
  }
}
