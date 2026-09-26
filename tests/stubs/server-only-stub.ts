// Vitest ejecuta el código de "servidor" directamente en Node (no dentro del
// pipeline de compilación de Next.js), que es el único contexto donde la
// condición de exports "react-server" del paquete real `server-only` resuelve
// a un módulo vacío. Este stub reproduce ese mismo comportamiento neutro para
// que los módulos de src/modules y src/server sigan siendo testeables
// directamente con Vitest.
export {};
