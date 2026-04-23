-- =============================================================
-- 02_triggers.sql
-- Trigger: trg_historial_cita
--   AFTER INSERT en citas → registra en historial_movimientos
-- Trigger: trg_invalidar_cache_vacuna
--   AFTER INSERT en vacunas_aplicadas → registra en historial_movimientos
--   (la invalidación real de Redis la hace la API al detectar este evento)
-- =============================================================

CREATE OR REPLACE FUNCTION fn_registrar_historial_cita()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO historial_movimientos (tipo, referencia_id, descripcion, fecha)
    VALUES (
        'NUEVA_CITA',
        NEW.id,
        FORMAT(
            'Cita agendada: mascota_id=%s, veterinario_id=%s, fecha=%s, motivo=%s',
            NEW.mascota_id,
            NEW.veterinario_id,
            NEW.fecha_hora,
            COALESCE(NEW.motivo, 'Sin motivo')
        ),
        NOW()
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_historial_cita ON citas;

CREATE TRIGGER trg_historial_cita
AFTER INSERT ON citas
FOR EACH ROW
EXECUTE FUNCTION fn_registrar_historial_cita();


-- Trigger para registrar vacunas aplicadas en el historial
CREATE OR REPLACE FUNCTION fn_registrar_historial_vacuna()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO historial_movimientos (tipo, referencia_id, descripcion, fecha)
    VALUES (
        'VACUNA_APLICADA',
        NEW.id,
        FORMAT(
            'Vacuna aplicada: mascota_id=%s, vacuna_id=%s, veterinario_id=%s, fecha=%s',
            NEW.mascota_id,
            NEW.vacuna_id,
            NEW.veterinario_id,
            NEW.fecha_aplicacion
        ),
        NOW()
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_historial_vacuna ON vacunas_aplicadas;

CREATE TRIGGER trg_historial_vacuna
AFTER INSERT ON vacunas_aplicadas
FOR EACH ROW
EXECUTE FUNCTION fn_registrar_historial_vacuna();


-- Trigger para generar alerta cuando stock de vacuna baja del mínimo
CREATE OR REPLACE FUNCTION fn_alerta_stock_bajo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.stock_actual < NEW.stock_minimo THEN
        INSERT INTO alertas (tipo, descripcion, fecha)
        VALUES (
            'STOCK_BAJO',
            FORMAT(
                'Vacuna "%s" (id=%s) tiene stock %s, mínimo requerido %s',
                NEW.nombre,
                NEW.id,
                NEW.stock_actual,
                NEW.stock_minimo
            ),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_alerta_stock ON inventario_vacunas;

CREATE TRIGGER trg_alerta_stock
AFTER UPDATE OF stock_actual ON inventario_vacunas
FOR EACH ROW
EXECUTE FUNCTION fn_alerta_stock_bajo();