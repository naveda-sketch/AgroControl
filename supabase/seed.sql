-- ============================================================
-- AgroControl - Seed: Solo usuarios reales
-- Base de datos en blanco lista para captura
-- ============================================================

-- ── Usuarios ──
INSERT INTO usuario (nombre, rol, pin_acceso, email, activo) VALUES
    ('Erick Naveda', 'ADMIN', '100100', 'erick@agrocontrol.app', true),
    ('Adrián Ramírez', 'ADMIN', '200200', 'adrian@agrocontrol.app', true),
    ('Gabriel Mejía', 'OPERADOR', '300300', 'gabriel@agrocontrol.app', true);
