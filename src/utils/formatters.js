/**
 * Formatters para BoxTrack
 */
export const Formatters = {
  cubicMeters(val) {
    if (val === null || val === undefined || isNaN(val)) return '0.00 m³';
    return `${Number(val).toFixed(2)} m³`;
  },

  currencyARS(amount) {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2
    }).format(num);
  },

  currencyUSD(amount) {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(num);
  },

  date(isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  moveStatusBadge(status) {
    const map = {
      'PRESUPUESTADO': {
        label: 'Presupuestado',
        bg: 'bg-[#1e2430]',
        text: 'text-[#d8dee9]',
        border: 'border-[#384152]',
        icon: 'clipboard'
      },
      'CARGA_EN_ORIGEN': {
        label: 'Cargando en Origen',
        bg: 'bg-blue-950',
        text: 'text-blue-200',
        border: 'border-blue-700',
        icon: 'truck'
      },
      'EN_TRANSITO': {
        label: 'En Tránsito / Ruta',
        bg: 'bg-sky-950',
        text: 'text-sky-200',
        border: 'border-sky-700',
        icon: 'route'
      },
      'EN_BAULERA_STORAGE': {
        label: 'En Guardamuebles / Box',
        bg: 'bg-amber-950',
        text: 'text-amber-200',
        border: 'border-amber-700',
        icon: 'box'
      },
      'DELIVERED_CONFIRMED': {
        label: 'Entregado y Conforme',
        bg: 'bg-emerald-950',
        text: 'text-emerald-200',
        border: 'border-emerald-700',
        icon: 'check'
      }
    };

    return map[status] || {
      label: status || 'Desconocido',
      bg: 'bg-[#1e2430]',
      text: 'text-[#cbd5e1]',
      border: 'border-[#384152]',
      icon: 'dot'
    };
  },

  storageStatusBadge(status) {
    const map = {
      'DISPONIBLE': {
        label: 'Disponible',
        bg: 'bg-emerald-950',
        text: 'text-emerald-200',
        border: 'border-emerald-700',
        icon: 'available'
      },
      'OCUPADO_AL_DIA': {
        label: 'Ocupado (Al Día)',
        bg: 'bg-blue-950',
        text: 'text-blue-200',
        border: 'border-blue-700',
        icon: 'box'
      },
      'EN_MORA_AVISO': {
        label: 'Mora (> 10 Días)',
        bg: 'bg-amber-950',
        text: 'text-amber-200',
        border: 'border-amber-700',
        icon: 'warning'
      },
      'ACCESO_BLOQUEADO': {
        label: 'Acceso Bloqueado',
        bg: 'bg-rose-950',
        text: 'text-rose-200',
        border: 'border-rose-700',
        icon: 'blocked'
      },
      'INTIMACION_REMATE': {
        label: 'Intimación Pre-Remate',
        bg: 'bg-red-950',
        text: 'text-red-200',
        border: 'border-red-700',
        icon: 'legal'
      }
    };

    return map[status] || {
      label: status || 'Desconocido',
      bg: 'bg-[#1e2430]',
      text: 'text-[#cbd5e1]',
      border: 'border-[#384152]',
      icon: 'dot'
    };
  },

  formatCubicMeters(val) {
    return this.cubicMeters(val);
  },

  formatCurrencyArs(val) {
    return this.currencyARS(val);
  },

  formatDate(iso) {
    return this.date(iso);
  },

  formatMoveStatusBadge(status) {
    const b = this.moveStatusBadge(status);
    return {
      ...b,
      badgeClass: `inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold border ${b.bg} ${b.text} ${b.border}`
    };
  },

  formatStorageStatusBadge(status) {
    const b = this.storageStatusBadge(status);
    return {
      ...b,
      badgeClass: `inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold border ${b.bg} ${b.text} ${b.border}`
    };
  }
};
