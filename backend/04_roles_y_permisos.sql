-- =============================================================
-- 04_roles_y_permisos.sql
-- Tres roles: rol_veterinario, rol_recepcion, rol_admin
-- Principio de mínimo privilegio aplicado tabla por tabla.
-- =============================================================

-- Limpiar roles si existen (útil para re-ejecutar)
DROP ROLE IF EXISTS rol_veterinario;
DROP ROLE IF EXISTS rol_recepcion;
DROP ROLE IF EXISTS rol_admin;

-- =============================================================
-- ROL: rol_veterinario
-- Puede ver solo sus mascotas (RLS lo filtra).
-- Puede registrar citas y aplicar vacunas a sus mascotas.
-- NO puede ver historial de mascotas que no atiende.
-- =============================================================
CREATE ROLE rol_veterinario;

-- Mascotas: SELECT filtrado por RLS
GRANT SELECT ON mascotas TO rol_veterinario;

-- Dueños: SELECT para ver datos de contacto de sus dueños
GRANT SELECT ON duenos TO rol_veterinario;

-- Citas: SELECT (filtrado por RLS) e INSERT para agendar
GRANT SELECT, INSERT ON citas TO rol_veterinario;
GRANT USAGE, SELECT ON SEQUENCE citas_id_seq TO rol_veterinario;

-- Vacunas aplicadas: SELECT e INSERT (filtrado por RLS)
GRANT SELECT, INSERT ON vacunas_aplicadas TO rol_veterinario;
GRANT USAGE, SELECT ON SEQUENCE vacunas_aplicadas_id_seq TO rol_veterinario;

-- Inventario: SELECT para ver qué vacunas hay disponibles
GRANT SELECT ON inventario_vacunas TO rol_veterinario;

-- Relación vet-mascota: SELECT para que RLS pueda consultarla
GRANT SELECT ON vet_atiende_mascota TO rol_veterinario;

-- Sin acceso a:
-- historial_movimientos (solo admin)
-- alertas (solo admin)
-- veterinarios (solo admin)


-- =============================================================
-- ROL: rol_recepcion
-- Ve todas las mascotas y dueños.
-- Puede agendar citas para cualquier mascota.
-- NO ve vacunas aplicadas (información médica).
-- =============================================================
CREATE ROLE rol_recepcion;

-- Mascotas: SELECT completo (sin RLS para recepción)
GRANT SELECT ON mascotas TO rol_recepcion;

-- Dueños: SELECT completo para datos de contacto
GRANT SELECT ON duenos TO rol_recepcion;

-- Citas: SELECT completo e INSERT para agendar
GRANT SELECT, INSERT ON citas TO rol_recepcion;
GRANT USAGE, SELECT ON SEQUENCE citas_id_seq TO rol_recepcion;

-- Veterinarios: SELECT para ver disponibilidad al agendar
GRANT SELECT ON veterinarios TO rol_recepcion;

-- Sin acceso a:
-- vacunas_aplicadas (información médica)
-- inventario_vacunas (gestión de inventario)
-- historial_movimientos
-- alertas
-- vet_atiende_mascota


-- =============================================================
-- ROL: rol_admin
-- Ve todo. Puede hacer todo.
-- Gestiona usuarios, inventario y asignaciones vet-mascota.
-- =============================================================
CREATE ROLE rol_admin;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rol_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rol_admin;

-- =============================================================
-- USUARIOS de base de datos (uno por rol para demo)
-- Contraseñas simples para demo local — en producción usar
-- variables de entorno o un vault.
-- =============================================================
DROP USER IF EXISTS vet_lopez;
DROP USER IF EXISTS vet_garcia;
DROP USER IF EXISTS vet_mendez;
DROP USER IF EXISTS recepcionista;
DROP USER IF EXISTS administrador;

CREATE USER vet_lopez    WITH PASSWORD 'vet_lopez_pass'    IN ROLE rol_veterinario;
CREATE USER vet_garcia   WITH PASSWORD 'vet_garcia_pass'   IN ROLE rol_veterinario;
CREATE USER vet_mendez   WITH PASSWORD 'vet_mendez_pass'   IN ROLE rol_veterinario;
CREATE USER recepcionista WITH PASSWORD 'recepcion_pass'   IN ROLE rol_recepcion;
CREATE USER administrador WITH PASSWORD 'admin_pass'       IN ROLE rol_admin;