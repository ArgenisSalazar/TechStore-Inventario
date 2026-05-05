-- =============================================
-- TechStore — Esquema de Base de Datos
-- Laboratorio 8: Seguridad en la Nube
-- Autor: Argenis Salazar
-- =============================================

-- Tabla: Tiendas
CREATE TABLE IF NOT EXISTS tiendas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla: Roles (RBAC)
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Tabla: Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  tienda_id INTEGER REFERENCES tiendas(id),
  mfa_habilitado BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  activo BOOLEAN DEFAULT TRUE,
  intentos_fallidos INTEGER DEFAULT 0,
  bloqueado_hasta TIMESTAMP,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Tabla: Usuario_Roles
CREATE TABLE IF NOT EXISTS usuario_roles (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rol_id INTEGER NOT NULL REFERENCES roles(id),
  asignado_por INTEGER REFERENCES usuarios(id),
  fecha_asignacion TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, rol_id)
);

-- Tabla: Productos (ABAC)
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  categoria VARCHAR(100),
  tienda_id INTEGER NOT NULL REFERENCES tiendas(id),
  es_premium BOOLEAN DEFAULT FALSE,
  creado_por INTEGER REFERENCES usuarios(id),
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Tabla: Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  usuario_email VARCHAR(255),
  accion VARCHAR(50) NOT NULL,
  recurso VARCHAR(100) NOT NULL,
  recurso_id INTEGER,
  detalles JSONB,
  ip_address VARCHAR(50),
  fecha TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- DATOS SEMILLA — Tiendas
-- =============================================
INSERT INTO tiendas (nombre, ciudad) VALUES
  ('TechStore Lima Centro', 'Lima'),
  ('TechStore Miraflores',  'Lima'),
  ('TechStore Arequipa',    'Arequipa')
ON CONFLICT DO NOTHING;

-- =============================================
-- DATOS SEMILLA — Roles
-- =============================================
INSERT INTO roles (nombre, descripcion) VALUES
  ('Admin',    'Administrador del sistema con acceso total a todas las funcionalidades'),
  ('Gerente',  'Gerente de tienda: gestiona productos de su ubicación y reportes'),
  ('Empleado', 'Empleado de ventas: consulta y actualiza stock, sin modificar precios'),
  ('Auditor',  'Solo lectura de todos los datos, genera reportes sin modificaciones')
ON CONFLICT (nombre) DO NOTHING;

-- =============================================
-- DATOS SEMILLA — Usuarios (password: Rol@2026 / Admin@1234)
-- Todos los hashes generados con bcrypt 12 rondas
-- =============================================

-- Admin: Admin@1234
INSERT INTO usuarios (email, password, nombre_completo, tienda_id, activo)
VALUES ('admin@techstore.com',
        '$2b$12$IF.75CXd6O/W.F./PXL88.HJWdoKiYksIF4ZexT5xRCa2fraAXheG',
        'Administrador TechStore', 1, TRUE)
ON CONFLICT (email) DO NOTHING;

-- Gerente Lima: Gerente@2026
INSERT INTO usuarios (email, password, nombre_completo, tienda_id, activo)
VALUES ('gerente@techstore.com',
        '$2b$12$PnvVIYkcHW7f0EdCTfrYYetHmu4frY9JBlRls1JbHqGVl1XTA.M4q',
        'Carlos Mendoza (Gerente Lima)', 1, TRUE)
ON CONFLICT (email) DO NOTHING;

-- Gerente Miraflores: Gerente@2026
INSERT INTO usuarios (email, password, nombre_completo, tienda_id, activo)
VALUES ('gerente.miraflores@techstore.com',
        '$2b$12$PnvVIYkcHW7f0EdCTfrYYetHmu4frY9JBlRls1JbHqGVl1XTA.M4q',
        'Sofia Rios (Gerente Miraflores)', 2, TRUE)
ON CONFLICT (email) DO NOTHING;

-- Empleado: Empleado@2026
INSERT INTO usuarios (email, password, nombre_completo, tienda_id, activo)
VALUES ('empleado@techstore.com',
        '$2b$12$Y66zBW6vZKJuijKu96oBaOIBZf.RZdJH4mc5rHbHlZhe5LD5CPpiu',
        'Luis Garcia (Empleado)', 1, TRUE)
ON CONFLICT (email) DO NOTHING;

-- Auditor: Auditor@2026
INSERT INTO usuarios (email, password, nombre_completo, tienda_id, activo)
VALUES ('auditor@techstore.com',
        '$2b$12$nSvQq2fsPbNBFnSYJ7ajIOrbd4C4/vAeIVzf3CKXMk3uZYoa8.Ixm',
        'Maria Torres (Auditora)', NULL, TRUE)
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- DATOS SEMILLA — Asignación de Roles
-- =============================================
INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT u.id, r.id FROM usuarios u, roles r
WHERE u.email = 'admin@techstore.com' AND r.nombre = 'Admin'
ON CONFLICT DO NOTHING;

INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT u.id, r.id FROM usuarios u, roles r
WHERE u.email = 'gerente@techstore.com' AND r.nombre = 'Gerente'
ON CONFLICT DO NOTHING;

INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT u.id, r.id FROM usuarios u, roles r
WHERE u.email = 'gerente.miraflores@techstore.com' AND r.nombre = 'Gerente'
ON CONFLICT DO NOTHING;

INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT u.id, r.id FROM usuarios u, roles r
WHERE u.email = 'empleado@techstore.com' AND r.nombre = 'Empleado'
ON CONFLICT DO NOTHING;

INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT u.id, r.id FROM usuarios u, roles r
WHERE u.email = 'auditor@techstore.com' AND r.nombre = 'Auditor'
ON CONFLICT DO NOTHING;

-- =============================================
-- DATOS SEMILLA — Productos de ejemplo
-- =============================================
INSERT INTO productos (nombre, descripcion, precio, stock, categoria, tienda_id, es_premium, creado_por)
SELECT 'Laptop HP Pavilion 15',
       'Procesador Intel Core i7, 16GB RAM, SSD 512GB, pantalla Full HD',
       3499.99, 8, 'Laptops', 1, FALSE, u.id
FROM usuarios u WHERE u.email = 'admin@techstore.com';

INSERT INTO productos (nombre, descripcion, precio, stock, categoria, tienda_id, es_premium, creado_por)
SELECT 'MacBook Pro M3',
       'Chip Apple M3, 16GB RAM unificada, 512GB SSD, pantalla Liquid Retina XDR',
       12999.00, 3, 'Laptops', 1, TRUE, u.id
FROM usuarios u WHERE u.email = 'admin@techstore.com';

INSERT INTO productos (nombre, descripcion, precio, stock, categoria, tienda_id, es_premium, creado_por)
SELECT 'iPhone 15 Pro',
       'Chip A17 Pro, triple cámara 48MP, Dynamic Island, titanio',
       6499.00, 5, 'Smartphones', 1, TRUE, u.id
FROM usuarios u WHERE u.email = 'admin@techstore.com';

INSERT INTO productos (nombre, descripcion, precio, stock, categoria, tienda_id, es_premium, creado_por)
SELECT 'Samsung Galaxy S24',
       'Exynos 2400, 256GB, cámara IA avanzada, pantalla 120Hz AMOLED',
       4199.00, 7, 'Smartphones', 1, FALSE, u.id
FROM usuarios u WHERE u.email = 'admin@techstore.com';

INSERT INTO productos (nombre, descripcion, precio, stock, categoria, tienda_id, es_premium, creado_por)
SELECT 'Mouse Logitech MX Master 3S',
       'Inalámbrico, 8000 DPI, scroll magnético, multi-dispositivo',
       299.90, 20, 'Accesorios', 1, FALSE, u.id
FROM usuarios u WHERE u.email = 'admin@techstore.com';

INSERT INTO productos (nombre, descripcion, precio, stock, categoria, tienda_id, es_premium, creado_por)
SELECT 'Monitor LG UltraWide 34"',
       '3440x1440 IPS, 160Hz, HDR10, USB-C 90W, compatible con Mac y PC',
       2899.00, 4, 'Monitores', 1, TRUE, u.id
FROM usuarios u WHERE u.email = 'admin@techstore.com';

-- Productos tienda Miraflores
INSERT INTO productos (nombre, descripcion, precio, stock, categoria, tienda_id, es_premium, creado_por)
SELECT 'Tablet iPad Air M2',
       'Pantalla Liquid Retina 11", chip M2, Wi-Fi 6E, 256GB',
       3799.00, 6, 'Tablets', 2, TRUE, u.id
FROM usuarios u WHERE u.email = 'admin@techstore.com';

INSERT INTO productos (nombre, descripcion, precio, stock, categoria, tienda_id, es_premium, creado_por)
SELECT 'Teclado Mecánico Keychron K2',
       'Switches Brown, RGB, compacto 75%, Bluetooth + cable',
       399.00, 15, 'Accesorios', 2, FALSE, u.id
FROM usuarios u WHERE u.email = 'admin@techstore.com';

INSERT INTO productos (nombre, descripcion, precio, stock, categoria, tienda_id, es_premium, creado_por)
SELECT 'Audífonos Sony WH-1000XM5',
       'Cancelación de ruido líder, 30h batería, Bluetooth multipoint',
       1299.00, 0, 'Audio', 2, FALSE, u.id
FROM usuarios u WHERE u.email = 'admin@techstore.com';

-- Productos tienda Arequipa
INSERT INTO productos (nombre, descripcion, precio, stock, categoria, tienda_id, es_premium, creado_por)
SELECT 'PC Gamer RTX 4070',
       'Ryzen 9 7900X, RTX 4070 12GB, 32GB DDR5, SSD 1TB NVMe',
       8999.00, 2, 'Gaming', 3, TRUE, u.id
FROM usuarios u WHERE u.email = 'admin@techstore.com';

INSERT INTO productos (nombre, descripcion, precio, stock, categoria, tienda_id, es_premium, creado_por)
SELECT 'Webcam Logitech StreamCam',
       '1080p 60fps, autofoco IA, USB-C, ideal para streaming y videollamadas',
       549.00, 12, 'Accesorios', 3, FALSE, u.id
FROM usuarios u WHERE u.email = 'admin@techstore.com';
