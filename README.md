# Respira · la red que cuida a quien cuida

Demo operable de la web app de Respira para presentar ante el jurado del hackathon. La familia registra el estado de la persona cuidada y lo que cada quien hace por ella. Ese registro reparte la carga, respalda la certificación de las cuidadoras, les abre financiamiento y activa una red de respiro con personas cercanas que ya saben cuidar.

> **Datos sintéticos.** Rosa, su mamá Lucía y su familia son personas ficticias. La demo corre solo en el navegador; no hay backend ni datos reales.

## Correr la demo

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm run start   # versión de producción
```

Para publicarla, cualquier hosting de Next.js funciona (por ejemplo Vercel: importar el repositorio y desplegar sin configuración extra).

## Cómo presentarla

1. Abre `/` y sigue el **Guion para el jurado** (8 pasos, unos 5 minutos).
2. Abre la app (`/app`) y el panel de la promotora (`/panel`) en **dos pestañas**: las acciones se sincronizan entre pestañas, así la alerta llega en vivo.
3. Activa **Capa técnica** en la barra superior para marcar, sobre cada elemento, el módulo, los datos, el servicio y la integración que lo respaldan. La página `/tecnico` muestra el mapa completo.
4. **Reiniciar** vuelve a los datos de ejemplo.

| Paso | Pantalla | Qué se ve |
| --- | --- | --- |
| 1 | `/app/crear-red` | Wizard: a quién cuidas, invitar a la familia, permisos |
| 2 | `/app/registrar` | Wizard: registrar una movilización que Mariana confirma (verificación V2) |
| 3 | `/app/whatsapp` | Audio de Rosa → resumen → semáforo rojo con el motivo |
| 4 | `/panel` | La promotora confirma la alerta, canaliza y valida la práctica (V3) |
| 5 | `/app/turnos` → `/app/relevo` | Hueco del sábado y relevo cercano por radio |
| 6 | `/panel/cooperativa` | La cooperativa confirma el relevo y se descuenta de la bolsa del DIF |
| 7 | `/app/pasaporte` | Horas verificadas, habilidades, apoyos elegibles y ruta a CONOCER |
| 8 | `/panel/indicadores` | Carga de cuidado por género, respiro y alertas revisadas |

## Qué es real y qué es simulado

Todo en esta demo es simulado en el navegador. El archivo `src/lib/tech.ts` documenta, para cada elemento de la interfaz, qué lo respaldará en el MVP y si será **real**, **real con datos sembrados**, **simulado** o de **fase posterior**. Ese mismo archivo alimenta la capa técnica y la página `/tecnico`.

Stack del MVP (decidido: web app / PWA):

- **Frente:** Next.js con dos áreas, `/app` (teléfono) y `/panel` (escritorio).
- **Datos y acceso:** Supabase (PostgreSQL con PostGIS y pgvector, autenticación por OTP, almacenamiento).
- **Agentes:** FastAPI para el webhook de WhatsApp (sandbox de Twilio), faster-whisper para voz a texto, reglas de alarma antes del LLM, Claude Haiku 5.5 con herramientas.
- **Directorio:** DENUE sector 62 y CLUES, en lugar de SIDECU durante el MVP.

## Estructura

```
src/
  app/
    page.tsx              Portada y guion para el jurado
    app/                  Web app de la familia (marco de teléfono en escritorio)
      crear-red/          Wizard: red familiar y consentimiento
      registrar/          Wizard: registrar estado y acciones con verificación
      turnos/             Turnos de la familia y huecos
      relevo/             Wizard: relevo cercano por radio
      pasaporte/          Pasaporte de Cuidado y financiamiento
      whatsapp/           Simulación del canal de WhatsApp
    panel/                Paneles web: promotora, cooperativa, indicadores
    tecnico/              Mapa técnico de la demo
  components/             Barra de demo, capa técnica, guion y componentes de UI
  lib/
    seed.ts               Datos sintéticos (Rosa y su red)
    store.tsx             Estado de la demo (localStorage, sincronizado entre pestañas)
    rules.ts              Reglas de alarma del semáforo y proyecciones (horas, carga, elegibilidad)
    tech.ts               Mapa técnico: qué respalda cada elemento
```

## Reglas de la demo

- **Semáforo:** reglas deterministas (confusión repentina, caída → rojo; poca agua, dolor → amarillo). Nunca depende de un LLM.
- **Verificación:** V0 autorreporte · V1 con evidencia · V2 confirmado por otra persona · V3 validado por la promotora.
- **Nivel C2:** microcurso + 3 prácticas validadas por la promotora.
- **Elegibilidad de ejemplo:** 250 h verificadas y 2 habilidades en C2. La regla real la define cada pagador.
