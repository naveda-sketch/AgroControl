-- ============================================================
-- AgroControl - Seed Data
-- Proyecto de maíz: 120 ha, temporada PV-2026
-- ============================================================

-- ── Usuarios ──
INSERT INTO usuario (id_usuario, nombre, rol, telefono, pin_acceso) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Carlos Mendoza', 'ADMIN', '+52 614 555 0100', '123456'),
    ('a1000000-0000-0000-0000-000000000002', 'Laura Vega', 'CFO', '+52 614 555 0200', '234567'),
    ('a1000000-0000-0000-0000-000000000003', 'Miguel Ángel Ríos', 'OPERADOR', '+52 614 555 0301', '111111'),
    ('a1000000-0000-0000-0000-000000000004', 'José Luis Herrera', 'OPERADOR', '+52 614 555 0302', '222222'),
    ('a1000000-0000-0000-0000-000000000005', 'Pedro Domínguez', 'OPERADOR', '+52 614 555 0303', '333333');

-- ── Proyecto ──
INSERT INTO proyecto (id_proyecto, nombre, temporada, hectareas_totales, presupuesto_x_ha, fecha_inicio, status) VALUES
    ('b1000000-0000-0000-0000-000000000001', 'Maíz Rancho El Porvenir PV-2026', 'PV-2026', 120.00, 28000.00, '2026-03-15', 'activo');

-- ── Parcelas ──
INSERT INTO parcela (id_parcela, id_proyecto, nombre_potrero, hectareas, tipo_suelo) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Potrero Norte', 45.00, 'Vertisol'),
    ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'Potrero Sur', 40.00, 'Vertisol'),
    ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'Potrero Oriente', 35.00, 'Feozem');

-- ── Etapas (4 por parcela) ──
INSERT INTO etapa (id_etapa, id_parcela, tipo, fecha_inicio, presupuesto_etapa, status) VALUES
    ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'PREPARACION', '2026-03-15', 315000.00, 'completada'),
    ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'SIEMBRA', '2026-04-01', 270000.00, 'activa'),
    ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'DESARROLLO', '2026-05-01', 405000.00, 'pendiente'),
    ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'COSECHA', '2026-09-01', 270000.00, 'pendiente'),
    ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 'PREPARACION', '2026-03-20', 280000.00, 'completada'),
    ('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002', 'SIEMBRA', '2026-04-05', 240000.00, 'activa'),
    ('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000002', 'DESARROLLO', '2026-05-05', 360000.00, 'pendiente'),
    ('d1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000002', 'COSECHA', '2026-09-05', 240000.00, 'pendiente'),
    ('d1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000003', 'PREPARACION', '2026-03-25', 245000.00, 'completada'),
    ('d1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000003', 'SIEMBRA', '2026-04-10', 210000.00, 'pendiente'),
    ('d1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000003', 'DESARROLLO', '2026-05-10', 315000.00, 'pendiente'),
    ('d1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000003', 'COSECHA', '2026-09-10', 210000.00, 'pendiente');

-- ── Equipos CAPEX ──
INSERT INTO equipo_capex (id_equipo, nombre, valor_adquisicion, vida_util_horas, costo_x_hectarea) VALUES
    ('e1000000-0000-0000-0000-000000000001', 'Tractor John Deere 6110B', 850000.00, 12000, 450.00),
    ('e1000000-0000-0000-0000-000000000002', 'Sembradora de Precisión Jag 4 surcos', 320000.00, 8000, null),
    ('e1000000-0000-0000-0000-000000000003', 'Rastra de Discos 24"', 180000.00, 6000, null),
    ('e1000000-0000-0000-0000-000000000004', 'Fumigadora DJI T30 (Dron)', 280000.00, 5000, null);

-- ── Almacén Virtual ──
INSERT INTO almacen_virtual (id_item, id_proyecto, producto, unidad_medida, cantidad_comprada, cantidad_disponible, costo_unitario_prom, fecha_entrada) VALUES
    ('f1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Semilla Híbrida DK-7500', 'kg', 3000.000, 2400.000, 85.5000, '2026-03-10'),
    ('f1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'Fertilizante DAP 18-46-00', 'kg', 12000.000, 10500.000, 18.7500, '2026-03-12'),
    ('f1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'Urea 46-00-00', 'kg', 8000.000, 8000.000, 14.2000, '2026-03-12'),
    ('f1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'Herbicida Glifosato', 'litros', 500.000, 420.000, 165.0000, '2026-03-08'),
    ('f1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'Insecticida Clorpirifos', 'litros', 200.000, 200.000, 320.0000, '2026-03-14'),
    ('f1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'Diésel', 'litros', 5000.000, 3200.000, 24.5000, '2026-03-10');

-- ── Comprobantes de ejemplo ──
INSERT INTO comprobante (id_comprobante, foto_url, ocr_proveedor, ocr_fecha, ocr_subtotal, ocr_iva, ocr_total, validado, sync_status) VALUES
    ('aa100000-0000-0000-0000-000000000001', 'https://storage.agrocontrol.app/tickets/001.jpg', 'Agroquímicos del Norte SA', '2026-03-10', 44100.00, 7056.00, 51156.00, true, 'sincronizado'),
    ('aa100000-0000-0000-0000-000000000002', 'https://storage.agrocontrol.app/tickets/002.jpg', 'Gasolinera Los Pinos', '2026-03-15', 43200.00, 6912.00, 50112.00, true, 'sincronizado'),
    ('aa100000-0000-0000-0000-000000000003', 'https://storage.agrocontrol.app/tickets/003.jpg', 'Semillas Nacionales SAPI', '2026-03-10', 256500.00, 41040.00, 297540.00, true, 'sincronizado');

-- ── Gastos de Preparación (ya ejercidos) ──
INSERT INTO gasto (id_gasto, id_etapa, id_comprobante, concepto, monto, tipo, registrado_por, sync_id) VALUES
    ('bb100000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'aa100000-0000-0000-0000-000000000002', 'Diésel para rastreo', 28350.00, 'OPEX', 'a1000000-0000-0000-0000-000000000003', 'cc100000-0000-0000-0000-000000000001'),
    ('bb100000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', null, 'Jornales limpieza de terreno (5 días x 4 peones)', 18000.00, 'OPEX', 'a1000000-0000-0000-0000-000000000003', 'cc100000-0000-0000-0000-000000000002'),
    ('bb100000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'aa100000-0000-0000-0000-000000000001', 'Herbicida pre-siembra (aplicación)', 13200.00, 'OPEX', 'a1000000-0000-0000-0000-000000000004', 'cc100000-0000-0000-0000-000000000003'),
    ('bb100000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000005', null, 'Diésel para rastreo', 25200.00, 'OPEX', 'a1000000-0000-0000-0000-000000000003', 'cc100000-0000-0000-0000-000000000004'),
    ('bb100000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000005', null, 'Jornales limpieza', 16000.00, 'OPEX', 'a1000000-0000-0000-0000-000000000004', 'cc100000-0000-0000-0000-000000000005'),
    ('bb100000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000009', null, 'Diésel para rastreo', 22050.00, 'OPEX', 'a1000000-0000-0000-0000-000000000005', 'cc100000-0000-0000-0000-000000000006'),
    ('bb100000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000009', null, 'Jornales limpieza', 14000.00, 'OPEX', 'a1000000-0000-0000-0000-000000000005', 'cc100000-0000-0000-0000-000000000007');

-- ── Uso de equipo (CAPEX) — NOTE: triggers will auto-create gastos ──
INSERT INTO uso_equipo (id_uso, id_equipo, id_etapa, horas_uso, hectareas_trabajadas, costo_calculado, fecha, operador) VALUES
    ('dd100000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 18.00, 45.00, 1275.00, '2026-03-16', 'a1000000-0000-0000-0000-000000000003'),
    ('dd100000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 15.00, 45.00, 450.00, '2026-03-17', 'a1000000-0000-0000-0000-000000000003'),
    ('dd100000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000005', 16.00, 40.00, 1133.33, '2026-03-21', 'a1000000-0000-0000-0000-000000000004');

-- ── Presupuesto Base ──
INSERT INTO presupuesto_base (id_budget, id_proyecto, etapa_tipo, concepto, monto_presupuestado) VALUES
    ('ee100000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'PREPARACION', 'Diésel y combustibles', 120000.00),
    ('ee100000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'PREPARACION', 'Mano de obra (jornales)', 72000.00),
    ('ee100000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'PREPARACION', 'Herbicida pre-siembra', 48000.00),
    ('ee100000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'SIEMBRA', 'Semilla', 360000.00),
    ('ee100000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'SIEMBRA', 'Fertilizante DAP', 300000.00),
    ('ee100000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'SIEMBRA', 'Mano de obra siembra', 60000.00),
    ('ee100000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000001', 'DESARROLLO', 'Fertilizante Urea', 200000.00),
    ('ee100000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000001', 'DESARROLLO', 'Insecticida', 96000.00),
    ('ee100000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000001', 'DESARROLLO', 'Riego y agua', 180000.00),
    ('ee100000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000001', 'COSECHA', 'Maquinaria cosecha', 360000.00),
    ('ee100000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000001', 'COSECHA', 'Flete y transporte', 180000.00),
    ('ee100000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000001', 'COSECHA', 'Mano de obra cosecha', 120000.00);

-- ── Calendario Lunar (Abril-Septiembre 2026) ──
INSERT INTO calendario_lunar (fecha, fase_lunar, recomendacion_siembra, recomendacion_cosecha) VALUES
    ('2026-04-01', 'creciente', 'Buen momento para siembra de maíz', null),
    ('2026-04-08', 'llena', 'Evitar siembra. Buen momento para fertilización foliar', null),
    ('2026-04-15', 'menguante', 'Ideal para control de malezas', null),
    ('2026-04-22', 'nueva', 'Evitar labores de siembra', null),
    ('2026-05-01', 'creciente', 'Favorable para transplante y resiembra', null),
    ('2026-05-08', 'llena', 'Aplicar fertilizante. No sembrar', null),
    ('2026-05-15', 'menguante', 'Control de plagas recomendado', null),
    ('2026-05-22', 'nueva', 'Descanso de labores de campo', null),
    ('2026-06-01', 'creciente', 'Riego abundante recomendado', null),
    ('2026-06-08', 'llena', null, null),
    ('2026-07-01', 'creciente', null, null),
    ('2026-08-01', 'menguante', null, 'Inicio de cosecha si maíz está en madurez fisiológica'),
    ('2026-08-15', 'nueva', null, 'No cosechar. Grano absorbe humedad'),
    ('2026-09-01', 'creciente', null, 'Buen momento para cosecha mecanizada'),
    ('2026-09-08', 'llena', null, 'Cosecha favorable. Grano seco'),
    ('2026-09-15', 'menguante', null, 'Ideal para cosecha y almacenaje');
