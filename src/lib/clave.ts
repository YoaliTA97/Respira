// Contraseñas: PBKDF2-SHA256 con sal aleatoria (Web Crypto). Nunca se guarda la contraseña en claro.
// En la demo el hash vive en el navegador; en el MVP la autenticación la maneja Supabase Auth.

const ITERACIONES = 100_000;
const aHex = (b: ArrayBuffer | Uint8Array) => Array.from(b instanceof Uint8Array ? b : new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");

async function derivar(clave: string, salt: string) {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey("raw", enc.encode(clave), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: ITERACIONES }, base, 256);
  return aHex(bits);
}

export async function crearHash(clave: string) {
  const salt = aHex(crypto.getRandomValues(new Uint8Array(16)));
  return { salt, hash: await derivar(clave, salt) };
}

export async function verificarClave(clave: string, guardada: { salt: string; hash: string }) {
  const h = await derivar(clave, guardada.salt);
  // comparación de longitud fija
  let dif = h.length ^ guardada.hash.length;
  for (let i = 0; i < Math.min(h.length, guardada.hash.length); i++) dif |= h.charCodeAt(i) ^ guardada.hash.charCodeAt(i);
  return dif === 0;
}

// Reglas mínimas: 8 caracteres, al menos una letra y un número.
export function problemaClave(clave: string) {
  if (clave.length < 8) return "Usa al menos 8 caracteres.";
  if (!/[a-záéíóúñ]/i.test(clave) || !/\d/.test(clave)) return "Combina letras y números.";
  return "";
}
