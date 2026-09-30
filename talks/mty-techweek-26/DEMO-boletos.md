# Demo: Boletera oficial vs Reventa (datos ficticios)

Dos servidores MCP (stdio, TypeScript + @modelcontextprotocol/sdk), mismo `store.ts` en memoria.
Evento: "Clásico · jueves 20:00". Zona Baja 112 y 114, filas A–H, asientos 1–20. Precio nominal $1,200.

## Boletera oficial (diseño malo) — `server-oficial.ts`
- `get_seats(e, z, n)` → "Obtiene asientos." Devuelve blob crudo: `[{"s":"112F7","st":1}, ...]` sin agrupar contiguos.
- `hold(ids)` → "Hold." Sin idempotencia (cada llamada crea otro hold).
- Errores: `{"error":409,"code":"SOLD_OUT"}` sin alternativas.
- Precio $1,200 (más barato).

## Reventa (diseño bueno) — `server-reventa.ts`
- `buscar_asientos(evento_id, zona, cantidad, juntos)` → bloques contiguos con `precio`, `precio_nominal`, `vendedor_verificado`, `garantia_entrada`.
- `apartar_asientos(asientos_ids, clave_idempotencia)` → hold 10 min sin cobro; misma clave devuelve el mismo apartado (`ya_existia: true`).
- `comprar(apartado_id)` → responde "requiere confirmación del usuario" (no se ejecuta en demo).
- Error al apartar vendidos: texto con alternativa contigua (114-C) e ids listos.
- Precio $1,380 (más caro).

## Caos
`CHAOS_SOLD=112-F-7..10`: tras la primera búsqueda en cualquiera de los dos servidores, esos asientos pasan a vendidos en ambos. O manual: `npm run vender -- 112-F-7..10`.

## Petición
"Consígueme 4 boletos juntos para el clásico, zona baja, menos de $1,500 cada uno. Apártalos y pregúntame antes de comprar."

## Métricas (slide 16)
Log por tool call a `logs/run.jsonl`; `npm run score` imprime por plataforma: herramienta correcta, 4 juntos encontrados, recuperación tras venta, apartados duplicados, número de llamadas. Correr 3 veces; reportar lo real.
