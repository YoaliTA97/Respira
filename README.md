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

**Caso de ejemplo:** doña Doreen Newman, 82 años, en Iztapalapa.
- **Familia:** Sara (hija, cuidadora principal), Karla (sobrina), Mariana y Diego (nietos).
- **Red cercana:** Lupe (vecina de enfrente), Ofelia (cuidadora certificada a 10 minutos) y don Luis (vecino de al lado, banco de tiempo).
- **Contraseña** de las cuentas de ejemplo: `respira2026`.

Abre **`/guion`**: sigue los bloques 3 a 6 del speech, y cada botón entra con la persona indicada. Los formularios tienen **Llenar con ejemplo**. **Seis meses después** lleva la demo al cierre del pitch: Sara certificada y con IMSS, y la red de Doreen de 3 a 14 personas. **Reiniciar** la deja como al inicio.

Qué incluye la app:

- **Acceso.**
  - Contraseña cifrada (PBKDF2) y bloqueo tras 5 intentos.
  - "Recordarme" por 12 horas y entrada por QR con código de familia.
  - Avisos y consentimiento de datos.
  - Accesos según el rol.
- **Resumen** con gráficas:
  - indicadores del piloto: horas de relevo para la cuidadora principal, Zarit, alertas graves atendidas en menos de 15 minutos, Mi voz, cuidadoras certificadas con ingreso, signos y medicación;
  - transición de roles (antes y ahora).
- **Nota de voz** con transcripción que una persona confirma.
  - "Vuelve a revisar" en 15 minutos.
  - Si se repite o empeora, alerta grave a pantalla completa (911, WhatsApp a toda la familia, ficha para paramédicos y quién puede llegar).
  - Botón de pánico.
  - Notificaciones que piden acción.
- **Mi voz** de la persona mayor:
  - su perfil en sus palabras;
  - cómo se siente;
  - decisiones de salud;
  - permisos y borrar su historial;
  - metas;
  - lo que aporta.
- **Red y relevos.**
  - Mapa de nodos que crece por etapas.
  - Apoyo por radio con calificaciones.
  - Mapa esquemático que funciona sin internet.
  - SIDECU.
  - Banco de tiempo.
  - Préstamo de equipo.
- **Valoración en checklist**, seguimiento y evidencia, gastos del cuidado (tope mensual y aportación voluntaria).
- **Capacitación.**
  - Ruta A y Ruta B (CONOCER EC0669 y EC1209.01).
  - Pasaporte de Cuidado con su sello.
  - CV de cuidado con apartado IMSS.
- **Pantallas del pitch:** `/impacto` (quién paga y el impacto) y `/respaldo` (límites y alcances: respuestas a las preguntas del jurado).

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
