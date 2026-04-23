-- =============================================================
-- 03_views.sql
-- Vista: v_mascotas_vacunacion_pendiente
--   Muestra mascotas cuya última vacuna tiene más de un año
--   o que nunca han sido vacunadas.
-- =============================================================

CREATE OR REPLACE VIEW v_mascotas_vacunacion_pendiente AS
SELECT
    m.id                                        AS mascota_id,
    m.nombre                                    AS mascota,
    m.especie,
    d.nombre                                    AS dueno,
    d.telefono,
    d.email,
    MAX(va.fecha_aplicacion)                    AS ultima_vacuna,
    CASE
        WHEN MAX(va.fecha_aplicacion) IS NULL
            THEN 'Nunca vacunada'
        WHEN MAX(va.fecha_aplicacion) < CURRENT_DATE - INTERVAL '1 year'
            THEN 'Vacuna vencida'
        ELSE 'Al día'
    END                                         AS estado_vacunacion,
    CURRENT_DATE - MAX(va.fecha_aplicacion)     AS dias_desde_ultima_vacuna
FROM mascotas m
JOIN duenos d ON d.id = m.dueno_id
LEFT JOIN vacunas_aplicadas va ON va.mascota_id = m.id
GROUP BY m.id, m.nombre, m.especie, d.nombre, d.telefono, d.email
HAVING
    MAX(va.fecha_aplicacion) IS NULL
    OR MAX(va.fecha_aplicacion) < CURRENT_DATE - INTERVAL '1 year'
ORDER BY dias_desde_ultima_vacuna DESC NULLS FIRST;