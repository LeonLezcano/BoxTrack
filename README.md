# 📦 BoxTrack — Mudanzas Corporativas, Cubaje, Fotos Pre-Daño, Rótulos QR y Guardamuebles

> **Versión:** `v1.0.00`  
> **Arquetipo:** Enterprise Logistics & Self-Storage Management  
> **Estándar:** AiAppFactory Invariants, Pure Forensic Cryptographic Seals (SHA-256) & Zero-Sink DOM Security

---

## 🚀 Resumen del Sistema

**BoxTrack** es la plataforma integral de gestión operativa y deslinde de responsabilidad legal para empresas de mudanzas corporativas, fletes de gran envergadura y complejos de guardamuebles / *self-storage*.

El sistema digitaliza de punta a punta la cadena de custodia forense de bienes trasladados: desde el cubicaje volumétrico automático ($m^3$) con sugerencia de flota vehicular y el relevamiento fotográfico de daños preexistentes, hasta el rotulado individual de bultos con códigos QR, la doble firma ePOD en origen y destino sellada criptográficamente con SHA-256 inmutable, y el centinela automatizado de mora con corte de PIN de acceso y protocolo de intimación legal de remate.

---

## 🛡️ Pilares Tecnológicos & Algorítmicos

### 1. 📐 Calculador Volumétrico de Mudanza & Sugerencia de Flota
- **Catálogo de Cúbica Estandarizada:** Mapeo de volumen de bultos estándar (cajas de vajilla, ropa, escritorios, sommiers, heladeras familiares, etc.).
- **Buffer de Estiba:** Aplicación automática de margen de seguridad (+10%) para acomodación en furgón o camión.
- **Sugerencia de Flota:** Clasificación instantánea de vehículo óptimo (`VAN_SMALL` 15 $m^3$, `TRUCK_MEDIUM` 35 $m^3$, `TRUCK_LARGE` 60 $m^3$, `SEMI_TRAILER` 90 $m^3$).

### 2. 📸 Motor de Peritaje Visual de Daños Preexistentes (Anti-Fraude)
- **Actas de Daño Previas:** Registro fotográfico y tipificación pericial de rayones, abolladuras, fisuras en vidrio o patas descoladas antes de cargar al camión.
- **Scoring de Riesgo:** Evaluación heurística ponderada (`BAJO`, `MEDIO`, `ALTO_RIESGO`) que alerta al personal sobre artículos de alta vulnerabilidad.

### 3. 🏷️ Trazabilidad QR de Bultos Individuales
- **Rotulado Único:** Generación secuencial de identificadores de bulto (`MOV-XXXX-B001`) con payload QR.
- **Doble Check-In:** Verificación de subida a bodega de camión en origen y confirmación de descarga en destino.

### 4. 🏢 Guardamuebles & Centinela de Mora (Self-Storage Dunning)
- **4 Etapas Normativas de Mora:**
  1. `OCUPADO_AL_DIA`: Acceso irrestricto con PIN habilitado.
  2. `EN_MORA_AVISO` (> 5 días): Recargo por mora y notificación preventiva.
  3. `ACCESO_BLOQUEADO` (> 15 días): Inhabilitación automática de PIN en portón de acceso y candado digital.
  4. `INTIMACION_REMATE` (> 30 días): Activación de protocolo legal de apertura y subasta de bienes.

### 5. 🔒 Doble Firma ePOD & Sello Criptográfico Inmutable SHA-256
- **Acta de Carga Origen:** Doble firma (Capataz de Cuadrilla + Cliente en Origen) y deslinde firmado de daños previos.
- **Generación de Hash:** Serialización canónica de la orden y cálculo de hash SHA-256 (64 caracteres hexadecimales) que blinda el acta ante manipulaciones.
- **Entrega Final ePOD:** Firma en destino y liquidación automática de saldo de presupuesto.

---

## 🧪 Arnés de Pruebas Multi-Capa (69 Tests — 100% PASS)

El proyecto cuenta con una batería de pruebas automatizadas en 5 capas:

```bash
# Ejecución de la suite completa de pruebas
pnpm test
# o alternativamente:
node tests/run_tests.js
```

1. **Capa 1: Unitarias & Fuzzing:** Algoritmos volumétricos, cálculo de buffer, scoring de riesgo de daños previos, cálculo de recargos de mora y pruebas caóticas con entradas Unicode/malformadas.
2. **Capa 2: Integración & Cadena de Custodia:** Ciclo de vida de órdenes, rotulado QR, sellado SHA-256 y verificación de manipulación de origen, contratos de bauleras y exportación CSV con BOM UTF-8 (`\uFEFF`).
3. **Capa 3: Componentes & Formateadores:** Formateo de monedas ARS/USD, metros cúbicos ($m^3$), insignias de estado y desinfección Zero-Sink DOM.
4. **Capa 4: Seguridad, CSP & Firestore Rules:** Reglas de RBAC en `firestore.rules`, cabeceras HTTP de hosting y escaneo de secretos.
5. **Capa 5: E2E Fluido & Notificaciones:** Simulación completa del ciclo de mudanza, persistencia local offline-first, invariante anti-siembras fantasma y generación de enlaces WhatsApp E.164.

---

## 🛡️ Auditoría de Seguridad (AppSec Guardian)

```bash
node ../AiAppFactory/tools/security-guardian/index.mjs .
# o con pnpm:
pnpm run security:full
```

- **Puntaje Obtenido:** **100/100**
- **Vulnerabilidades:** 0 Críticas | 0 Altas | 0 Medias | 0 Bajas

---

## 📱 Operatividad Móvil Verificada (Playwright MCP)

- Probado bajo viewport de smartphone (`393x852` px) con áreas táctiles $\ge 44 \times 44$ px.
- **Tolerancia Cero en Consola:** **0 Errores** reportados durante la navegación y ciclo de vida de operaciones.
