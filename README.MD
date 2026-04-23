# README — Clínica Veterinaria · Corte 3 BDA
**Matrícula:** 243726  
**Curso:** Base de Datos Avanzadas · UP Chiapas  
**Docente:** Mtro. Ramsés Alejandro Camas Nájera  

Sistema full-stack de clínica veterinaria con seguridad de base de datos como eje central.

**Stack:** Node.js + Express · Next.js · PostgreSQL 16 · Redis 7 · Docker

---

## Cómo levantar el proyecto

Solo necesitas Docker instalado. Un solo comando levanta todo:

```bash
docker-compose up --build
```

Esto levanta PostgreSQL, Redis, la API y el frontend al mismo tiempo.
El schema y todos los archivos SQL se cargan automáticamente al iniciar el contenedor de postgres.

Una vez que termine de levantar, entra a:
- **Frontend:** http://localhost:3001
- **API:** http://localhost:4000/api

---

## Estructura del proyecto

corte3-bda-243726/
├── README.md
├── cuaderno_ataques.md
├── schema_corte3.sql
├── docker-compose.yml
├── .env
├── backend/
│   ├── 01_procedures.sql
│   ├── 02_triggers.sql
│   ├── 03_views.sql
│   ├── 04_roles_y_permisos.sql
│   └── 05_rls.sql
├── api/
│   ├── config/
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── users.js
│   ├── controllers/
│   │   ├── mascotasController.js
│   │   └── vacunasController.js
│   ├── middlewares/
│   │   └── auth.js
│   ├── routes/
│   │   ├── mascotasRoutes.js
│   │   └── vacunasRoutes.js
│   ├── Dockerfile
│   ├── index.js
│   └── package.json
└── frontend/
├── src/app/
│   ├── page.tsx           (Login)
│   ├── mascotas/page.tsx  (Búsqueda + demo SQL injection)
│   └── vacunacion/page.tsx (Caché Redis)
├── Dockerfile
└── package.json

---

## Usuarios disponibles para probar

| Usuario | Rol | Qué puede ver |
|---|---|---|
| vet_lopez | veterinario | Solo Firulais, Toby y Max |
| vet_garcia | veterinario | Solo Misifú, Luna y Dante |
| vet_mendez | veterinario | Solo Rocky, Pelusa, Coco y Mango |
| recepcionista | recepcion | Todas las mascotas y citas |
| administrador | admin | Todo |

---

## Las 6 preguntas de decisiones de diseño

### 1. ¿Qué política RLS aplicaste a la tabla `mascotas`?

Esta es la política que puse:

```sql
CREATE POLICY pol_mascotas_veterinario
ON mascotas
FOR ALL
TO rol_veterinario
USING (
    id IN (
        SELECT mascota_id
        FROM vet_atiende_mascota
        WHERE vet_id = current_setting('app.vet_id', TRUE)::INT
          AND activa = TRUE
    )
);
```

Lo que hace es filtrar las filas de la tabla mascotas dependiendo de quién esté haciendo la consulta. Cuando un veterinario hace un SELECT, PostgreSQL revisa automáticamente esta política y solo le devuelve las mascotas que aparecen en `vet_atiende_mascota` con su `vet_id`. Si el vet no tiene ninguna mascota asignada, no ve nada. El admin tiene su propia política que simplemente dice `USING (TRUE)`, o sea, ve todo sin filtro.

Lo probé iniciando sesión como `vet_lopez` y solo aparecen Firulais, Toby y Max, que son exactamente las 3 que le asigna el schema. Con `vet_garcia` aparecen otras 3 distintas. Eso confirma que la política está funcionando.

---

### 2. Vector de ataque posible en la estrategia de identidad y cómo lo prevengo

Uso `current_setting('app.vet_id', TRUE)` para que PostgreSQL sepa qué veterinario está haciendo la consulta. El backend ejecuta `SET LOCAL app.vet_id = '1'` al inicio de cada transacción.

El problema potencial es que si alguien tuviera acceso directo a la base de datos con el rol `rol_veterinario`, podría ejecutar `SET app.vet_id = 2` y ver las mascotas de otro veterinario, básicamente saltándose el RLS.

En mi sistema eso no es posible porque el frontend nunca se conecta directo a PostgreSQL, todo pasa por la API de Express. Y el `vet_id` que se mete en el SET no viene del usuario sino del objeto `USUARIOS` que está hardcodeado en `api/config/users.js`. O sea, el cliente nunca puede controlar qué valor toma ese setting.

---

### 3. ¿Usaste SECURITY DEFINER? ¿Por qué?

No lo usé. La razón es que no lo necesité — los roles ya tienen los permisos directos sobre las tablas que necesitan gracias a los GRANT en `04_roles_y_permisos.sql`. Por ejemplo, `rol_veterinario` tiene `GRANT SELECT, INSERT ON vacunas_aplicadas` directamente, entonces el procedure puede hacer su trabajo sin necesitar ejecutarse con permisos elevados.

Si hubiera usado SECURITY DEFINER, el procedure correría con los permisos del dueño de la función (normalmente postgres/superusuario), y si alguien manipulara el `search_path` podría hacer que el procedure ejecute funciones de un schema distinto al esperado, lo que es una escalada de privilegios conocida. Como no lo necesité, preferí evitar ese riesgo.

---

### 4. TTL del caché Redis y por qué ese valor

Le puse 300 segundos (5 minutos). Lo elegí así:

La consulta de vacunación pendiente recorre todas las mascotas y todas sus vacunas, que en una clínica real puede ser pesada. Pero tampoco cambia tan seguido — no se están aplicando vacunas cada segundo. Entonces 5 minutos es un punto medio razonable.

Si el TTL fuera muy bajo, tipo 10 segundos, el caché prácticamente no sirve de nada porque casi cada consulta haría MISS y golpearía la base de datos igual.

Si fuera muy alto, tipo 1 hora, el problema es que alguien podría vacunar a una mascota y esa mascota seguiría apareciendo en el listado de "vacunación pendiente" durante toda una hora, lo cual es incorrecto y podría confundir al personal.

Por eso además del TTL implementé invalidación inmediata: cuando se aplica una vacuna, el endpoint borra la key de Redis al momento con `redisClient.del('vacunacion_pendiente')`. Así aunque el TTL sea de 5 minutos, si algo cambia se refleja de inmediato en la siguiente consulta.

---

### 5. Línea exacta de hardening contra SQL Injection

El endpoint crítico es `GET /api/mascotas/buscar?nombre=<texto>` porque recibe texto libre del usuario.

**Archivo:** `api/controllers/mascotasController.js`

```js
const result = await client.query(sql, [`%${nombre}%`]);
```

El `nombre` viene de `req.query.nombre` que es lo que el usuario escribe en el buscador del frontend. En lugar de meterlo directo al SQL con concatenación de strings, se pasa como segundo argumento de `.query()`. El driver `pg` lo manda a PostgreSQL como parámetro vinculado en el protocolo de red, separado del texto de la consulta.

Entonces si alguien escribe `' OR '1'='1`, PostgreSQL lo recibe como el string literal `%' OR '1'='1%` que busca con ILIKE en el nombre de la mascota. No lo interpreta como sintaxis SQL. Probé esto y efectivamente no devuelve nada, el ataque falla.

---

### 6. Si revoco todos los permisos del rol veterinario excepto SELECT en mascotas

Tres cosas que dejarían de funcionar:

1. **Aplicar vacunas** — el endpoint `POST /api/vacunas/aplicar` hace un INSERT en `vacunas_aplicadas`. Sin ese permiso, PostgreSQL rechaza la operación con "permission denied for table vacunas_aplicadas" y la API devuelve error 500.

2. **Ver datos del dueño** — la query de búsqueda hace `JOIN duenos d ON d.id = m.dueno_id`. Si se revoca SELECT en `duenos`, el JOIN falla aunque tengan SELECT en mascotas, así que la búsqueda completa devuelve error.

3. **El RLS deja de funcionar correctamente** — la política de mascotas hace un subquery a `vet_atiende_mascota` para saber qué mascotas le pertenecen al vet. Si se revoca SELECT en esa tabla, la política no puede evaluarse y el veterinario no vería ninguna mascota, o PostgreSQL lanzaría un error de permisos al intentar aplicar la política.