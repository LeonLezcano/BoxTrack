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
        bg: 'bg-slate-800',
        text: 'text-slate-300',
        border: 'border-slate-700',
        icon: '📋'
      },
      'CARGA_EN_ORIGEN': {
        label: 'Cargando en Origen',
        bg: 'bg-blue-500/20',
        text: 'text-blue-400',
        border: 'border-blue-500/40',
        icon: '🚛'
      },
      'EN_TRANSITO': {
        label: 'En Tránsito / Ruta',
        bg: 'bg-purple-500/20',
        text: 'text-purple-400',
        border: 'border-purple-500/40',
        icon: '🛣️'
      },
      'EN_BAULERA_STORAGE': {
        label: 'En Guardamuebles / Box',
        bg: 'bg-amber-500/20',
        text: 'text-amber-400',
        border: 'border-amber-500/40',
        icon: '📦'
      },
      'DELIVERED_CONFIRMED': {
        label: 'Entregado & Conforme',
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-400',
        border: 'border-emerald-500/40',
        icon: '✓'
      }
    };

    return map[status] || {
      label: status || 'Desconocido',
      bg: 'bg-slate-800',
      text: 'text-slate-400',
      border: 'border-slate-700',
      icon: '•'
    };
  },

  storageStatusBadge(status) {
    const map = {
      'DISPONIBLE': {
        label: 'Disponible',
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-400',
        border: 'border-emerald-500/40',
        icon: '🟢'
      },
      'OCUPADO_AL_DIA': {
        label: 'Ocupado (Al Día)',
        bg: 'bg-blue-500/20',
        text: 'text-blue-400',
        border: 'border-blue-500/40',
        icon: '📦'
      },
      'EN_MORA_AVISO': {
        label: 'Mora (> 10 Días)',
        bg: 'bg-amber-500/20',
        text: 'text-amber-400',
        border: 'border-amber-500/40',
        icon: '⚠️'
      },
      'ACCESO_BLOQUEADO': {
        label: 'Acceso Bloqueado',
        bg: 'bg-rose-500/20',
        text: 'text-rose-400',
        border: 'border-rose-500/40',
        icon: '⛔'
      },
      'INTIMACION_REMATE': {
        label: 'Intimación Pre-Remate',
        bg: 'bg-red-900/40',
        text: 'text-red-400',
        border: 'border-red-500/60',
        icon: '⚖️'
      }
    };

    return map[status] || {
      label: status || 'Desconocido',
      bg: 'bg-slate-800',
      text: 'text-slate-400',
      border: 'border-slate-700',
      icon: '•'
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
      badgeClass: `inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${b.bg} ${b.text} ${b.border}`
    };
  },

  formatStorageStatusBadge(status) {
    const b = this.storageStatusBadge(status);
    return {
      ...b,
      badgeClass: `inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${b.bg} ${b.text} ${b.border}`
    };
  }
};
