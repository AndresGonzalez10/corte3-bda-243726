-- =============================================================
-- 01_procedures.sql
-- Procedure: sp_agendar_cita
-- Function:  fn_total_facturado
-- =============================================================

-- Procedure para agendar una cita
CREATE OR REPLACE PROCEDURE sp_agendar_cita(
    p_mascota_id      INT,
    p_veterinario_id  INT,
    p_fecha_hora      TIMESTAMP,
    p_motivo          TEXT,
    OUT p_cita_id     INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_vet_activo     BOOLEAN;
    v_dia_semana     TEXT;
    v_dias_descanso  TEXT;
BEGIN
    -- Validar que la mascota existe
    IF NOT EXISTS (SELECT 1 FROM mascotas WHERE id = p_mascota_id) THEN
        RAISE EXCEPTION 'Mascota con id % no existe', p_mascota_id;
    END IF;

    -- Validar que el veterinario existe y está activo
    SELECT activo, dias_descanso
    INTO v_vet_activo, v_dias_descanso
    FROM veterinarios
    WHERE id = p_veterinario_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Veterinario con id % no existe', p_veterinario_id;
    END IF;

    IF NOT v_vet_activo THEN
        RAISE EXCEPTION 'El veterinario con id % no está activo', p_veterinario_id;
    END IF;

    -- Validar que el veterinario no esté en día de descanso
    v_dia_semana := LOWER(TO_CHAR(p_fecha_hora, 'day'));
    v_dia_semana := TRIM(v_dia_semana);

    IF v_dias_descanso IS NOT NULL AND v_dias_descanso <> '' THEN
        IF v_dias_descanso ILIKE '%' || v_dia_semana || '%' THEN
            RAISE EXCEPTION 'El veterinario descansa los %. No se puede agendar para esa fecha', v_dia_semana;
        END IF;
    END IF;

    -- Insertar la cita
    INSERT INTO citas (mascota_id, veterinario_id, fecha_hora, motivo, estado)
    VALUES (p_mascota_id, p_veterinario_id, p_fecha_hora, p_motivo, 'AGENDADA')
    RETURNING id INTO p_cita_id;

    RAISE NOTICE 'Cita agendada correctamente con id %', p_cita_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;


-- Función para calcular total facturado por mascota en un año
CREATE OR REPLACE FUNCTION fn_total_facturado(
    p_mascota_id  INT,
    p_anio        INT
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_citas    NUMERIC := 0;
    v_total_vacunas  NUMERIC := 0;
BEGIN
    -- Sumar costos de citas completadas
    SELECT COALESCE(SUM(costo), 0)
    INTO v_total_citas
    FROM citas
    WHERE mascota_id = p_mascota_id
      AND EXTRACT(YEAR FROM fecha_hora) = p_anio
      AND estado = 'COMPLETADA';

    -- Sumar costos de vacunas aplicadas
    SELECT COALESCE(SUM(costo_cobrado), 0)
    INTO v_total_vacunas
    FROM vacunas_aplicadas
    WHERE mascota_id = p_mascota_id
      AND EXTRACT(YEAR FROM fecha_aplicacion) = p_anio;

    RETURN v_total_citas + v_total_vacunas;
END;
$$;