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

1. `/login` → entra como **Rosa** (coordina el espacio de la familia Hernández). El código de acceso de la demo es `123456`.
2. **Inicio**: su perfil, sus espacios y sus próximos relevos.
3. **Resumen** del espacio: estado de Lucía, cobertura, medicación y quién cuidó.
4. **Lucía**: condición médica con etiquetas propias, signos a vigilar, alergias, umbrales y medicación.
5. **Chat y reportes** → ejemplo "Trifecta de alerta". Sale una alerta roja, el aviso por WhatsApp y los centros cercanos.
6. **Relevos**: semana de turnos, el sábado sin cubrir, intercambio de horas o búsqueda en la red por radio.
7. **Integrantes**: mapa de nodos y alta de personas. Si ya tienen perfil, se vinculan con su teléfono.
8. Abre otra pestaña como **Jorge** o **Lupita** para aceptar intercambios, invitaciones o solicitudes de la red.
9. `/registro` y **Crear espacio**: alta de una familia nueva con el ejemplo de caída y diabetes.

Activa **Capa técnica** en la barra lateral para ver, sobre cada elemento, qué lo respalda. `/tecnico` muestra el mapa completo: qué opera, qué opera si se configura y qué es simulado.

## Límites de la demo

- Los datos viven en el navegador (`localStorage`). Cada visitante tiene su propia copia, y las pestañas del mismo navegador se sincronizan. Para varios teléfonos hace falta el backend (Supabase con políticas por membresía).
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
