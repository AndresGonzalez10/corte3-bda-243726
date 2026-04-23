-- =============================================================
-- 05_rls.sql
-- Row-Level Security sobre mascotas, vacunas_aplicadas y citas.
-- Mecanismo de identidad: current_setting('app.vet_id', TRUE)
--   El backend ejecuta SET LOCAL app.vet_id = '<id>' al inicio
--   de cada transacción autenticada como veterinario.
-- =============================================================

-- =============================================================
-- TABLA: mascotas
-- Veterinario ve solo las suyas (según vet_atiende_mascota).
-- Recepción y admin ven todo.
-- =============================================================
ALTER TABLE mascotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mascotas FORCE ROW LEVEL SECURITY;

-- Política para veterinarios: solo sus mascotas asignadas
DROP POLICY IF EXISTS pol_mascotas_veterinario ON mascotas;
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

-- Política para recepción: ve todo
DROP POLICY IF EXISTS pol_mascotas_recepcion ON mascotas;
CREATE POLICY pol_mascotas_recepcion
ON mascotas
FOR SELECT
TO rol_recepcion
USING (TRUE);

-- Política para admin: ve todo
DROP POLICY IF EXISTS pol_mascotas_admin ON mascotas;
CREATE POLICY pol_mascotas_admin
ON mascotas
FOR ALL
TO rol_admin
USING (TRUE);


-- =============================================================
-- TABLA: vacunas_aplicadas
-- Veterinario ve solo las de sus mascotas.
-- Recepción NO tiene SELECT (controlado por GRANT, no RLS).
-- Admin ve todo.
-- =============================================================
ALTER TABLE vacunas_aplicadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacunas_aplicadas FORCE ROW LEVEL SECURITY;

-- Política para veterinarios
DROP POLICY IF EXISTS pol_vacunas_veterinario ON vacunas_aplicadas;
CREATE POLICY pol_vacunas_veterinario
ON vacunas_aplicadas
FOR ALL
TO rol_veterinario
USING (
    mascota_id IN (
        SELECT mascota_id
        FROM vet_atiende_mascota
        WHERE vet_id = current_setting('app.vet_id', TRUE)::INT
          AND activa = TRUE
    )
);

-- Política para admin: ve todo
DROP POLICY IF EXISTS pol_vacunas_admin ON vacunas_aplicadas;
CREATE POLICY pol_vacunas_admin
ON vacunas_aplicadas
FOR ALL
TO rol_admin
USING (TRUE);


-- =============================================================
-- TABLA: citas
-- Veterinario ve solo donde él es el veterinario asignado.
-- Recepción ve todas.
-- Admin ve todas.
-- =============================================================
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas FORCE ROW LEVEL SECURITY;

-- Política para veterinarios
DROP POLICY IF EXISTS pol_citas_veterinario ON citas;
CREATE POLICY pol_citas_veterinario
ON citas
FOR ALL
TO rol_veterinario
USING (
    veterinario_id = current_setting('app.vet_id', TRUE)::INT
);

-- Política para recepción: ve todas
DROP POLICY IF EXISTS pol_citas_recepcion ON citas;
CREATE POLICY pol_citas_recepcion
ON citas
FOR ALL
TO rol_recepcion
USING (TRUE);

-- Política para admin: ve todas
DROP POLICY IF EXISTS pol_citas_admin ON citas;
CREATE POLICY pol_citas_admin
ON citas
FOR ALL
TO rol_admin
USING (TRUE);