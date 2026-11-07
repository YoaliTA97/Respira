# Respira · la red que cuida a quien cuida

Web app (PWA) de Respira para el hackathon BUILD-HER. Cada persona tiene su perfil, que lleva a cualquier espacio familiar y a la red: sus roles, su experiencia y su disponibilidad. El perfil funciona como una cuenta de Notion. Cada familia tiene un espacio privado al que solo se entra por invitación. Ahí registran el estado de la persona que cuidan, se reparten los relevos y reciben alertas. Desde ahí también buscan apoyo en la red de cuidado por radio.

> **Datos sintéticos.** La familia Hernández, Lucía y los perfiles de la red son ficticios. Solo los centros de salud del mapa son reales (DENUE, INEGI, sector 62).

## Correr

```bash
npm install
npm run dev                     # http://localhost:3000
npm run build && npm run start  # producción
```

Con Node 20.9 o más reciente. Las variables de entorno son opcionales. Sin ellas, el asistente responde con reglas y el WhatsApp queda en modo simulado.

| Variable | Activa |
| --- | --- |
| `ANTHROPIC_API_KEY` | El asistente redacta con Claude. Las reglas de alarma siempre corren primero y el modelo nunca baja el nivel. |
| `ASISTENTE_MODELO` | Modelo del asistente (por defecto `claude-opus-5-5`). |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` | Alertas reales por WhatsApp a los familiares principales. |

## Publicar en Netlify

`netlify.toml` ya trae la configuración: build `npm run build`, publicación `.next` y Node 22. Netlify detecta Next.js y despliega las rutas `/api/*` como funciones. Se importa el repositorio, sin directorio base, y se agregan las variables de entorno de la tabla.

## Recorrido

Abre **`/guion`**: son 8 pasos para unos 3 minutos. Cada botón entra con la persona indicada y abre la pantalla, con datos de ejemplo ya cargados. Los formularios tienen botones de **Llenar con ejemplo** para no capturar en vivo.

Qué incluye la app:

- **Resumen de la familia.** Indicadores de 30 días:
  - horas de relevo al mes;
  - sobrecarga con la escala de Zarit abreviada;
  - alertas atendidas a tiempo, contadas por la primera respuesta;
  - cuidadoras certificadas con ingreso.
- **Integrantes.**
  - Mapa de nodos.
  - Alta por teléfono: si la persona ya tiene perfil, se vincula.
  - QR para unirse al espacio, con código de familia.
  - En la simulación, las invitaciones se aceptan solas.
- **Valoración en checklist:**
  - biométricos con foto de evidencia;
  - síntomas;
  - estado de conciencia guiado;
  - historia clínica;
  - uso de servicios de salud;
  - resultado con las reglas de alarma.
- **Voz de la persona cuidada (Mi voz).**
  - Su perfil en sus palabras, por nota de voz.
  - Cómo se siente hoy.
  - Decisiones de salud y voluntad anticipada.
  - Quién ve su historial.
  - Metas de autonomía.
  - Sus horas en el banco de tiempo.
- **Alertas.**
  - Trifecta y botón de pánico.
  - WhatsApp con el enlace a SIDECU.
  - Ficha de emergencia.
  - Mensajes dentro de la alerta y reenvío por WhatsApp desde el teléfono (wa.me).
- **Red por radio.** Une la red de Respira con la base de SIDECU (personas y centros).
- **Equipo médico.** Préstamo entre perfiles y renta con aliados.
- **Seguimiento y evidencia.** Bitácora, fotos y confirmación por otro integrante.
- **Capacitación.** Tutoriales, guías del médico en video (el enlace se carga cuando lo entregue el médico aliado) y certificaciones.
- **CV de cuidado.** Habilidades, evidencia, certificaciones e ingreso; se descarga en PDF.
- **Accesos según el rol.** El menú solo muestra lo que corresponde a los roles del perfil y del espacio.

Activa **Capa técnica** en la barra lateral para ver qué respalda cada elemento. `/tecnico` muestra el mapa completo.

## Límites de la demo

- Los datos viven en el navegador (`localStorage`): sobreviven a recargar, cerrar sesión o cerrar la pestaña, y la última sesión se recuerda. Al publicar una versión nueva se renueva solo la familia de ejemplo; lo creado se conserva. Cada teléfono tiene su propia copia: para que varios compartan la misma familia en tiempo real hace falta el backend (Supabase con políticas por membresía).
- El acceso por código y la aprobación de certificaciones están simulados. Los videos de tutoriales todavía no existen.

## Estructura

```
src/
  app/
    page.tsx            Portada
    login/ registro/    Acceso y alta de perfil
    (plataforma)/       App con sesión: inicio, perfil, red, capacitación y el espacio familiar
    centros/            Mapa público de centros (DENUE)
    tecnico/            Mapa técnico
    api/asistente/      Reglas + Claude
    api/whatsapp/       Envío por Twilio
  components/           UI, mapas, etiquetas, alta de integrantes, condición médica
  lib/                  Tipos, catálogos, reglas, cálculos, semilla y proveedor de datos
```
