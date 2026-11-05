import { StorageDunningSentinel, STORAGE_UNITS_CATALOG } from '../core/storageDunningSentinel.js';

export class StorageContractService {
  /**
   * Crea o asigna un contrato de alquiler de baulera
   */
  static createContract({
    unitCode = 'BOX-A-12',
    unitType = 'MEDIUM_15',
    customerId,
    customerName,
    customerPhone,
    monthlyFeeArs = null,
    startDate = new Date().toISOString(),
    dueDayOfMonth = 10
  }) {
    if (!customerId || !customerName || !unitCode) {
      throw new Error('Datos incompletos para crear contrato de baulera');
    }

    const spec = STORAGE_UNITS_CATALOG[unitType] || STORAGE_UNITS_CATALOG.MEDIUM_15;
    const fee = monthlyFeeArs !== null ? Number(monthlyFeeArs) : spec.monthlyFeeArs;

    const contractId = `CTR-${unitCode}-${Math.random().toString(36).slice(2, 6)}`;
    
    // Próximo vencimiento
    const now = new Date();
    const nextDue = new Date(now.getFullYear(), now.getMonth(), dueDayOfMonth).toISOString();

    const contract = {
      contractId,
      unitCode,
      unitType,
      unitName: spec.name,
      capacityM3: spec.capacityM3,
      customerId,
      customerName,
      customerPhone: String(customerPhone || '').trim(),
      monthlyFeeArs: fee,
      startDate,
      nextDueDate: nextDue,
      currentDunning: StorageDunningSentinel.evaluateDunning(nextDue, fee)
    };

    return contract;
  }

  /**
   * Actualiza el estado de mora y acceso de un contrato
   */
  static evaluateContractStatus(contract) {
    if (!contract) throw new Error('Contrato no especificado');
    const dunning = StorageDunningSentinel.evaluateDunning(contract.nextDueDate, contract.monthlyFeeArs);
    return {
      ...contract,
      currentDunning: dunning
    };
  }
}
