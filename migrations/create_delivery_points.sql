-- Crear tabla de puntos de entrega
CREATE TABLE IF NOT EXISTS delivery_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  zone TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas por agricultor
CREATE INDEX IF NOT EXISTS idx_delivery_points_farmer_id ON delivery_points(farmer_id);

-- Crear índice para búsquedas por zona
CREATE INDEX IF NOT EXISTS idx_delivery_points_zone ON delivery_points(zone);

-- Crear índice para búsquedas por estado activo
CREATE INDEX IF NOT EXISTS idx_delivery_points_is_active ON delivery_points(is_active);

-- Habilitar RLS (Row Level Security)
ALTER TABLE delivery_points ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver todos los puntos de entrega activos
CREATE POLICY "Los usuarios pueden ver puntos de entrega activos"
  ON delivery_points
  FOR SELECT
  USING (is_active = true);

-- Política: Los agricultores pueden ver sus propios puntos de entrega
CREATE POLICY "Los agricultores pueden ver sus propios puntos de entrega"
  ON delivery_points
  FOR SELECT
  USING (auth.uid() = farmer_id);

-- Política: Los agricultores pueden crear sus propios puntos de entrega
CREATE POLICY "Los agricultores pueden crear sus propios puntos de entrega"
  ON delivery_points
  FOR INSERT
  WITH CHECK (auth.uid() = farmer_id);

-- Política: Los agricultores pueden actualizar sus propios puntos de entrega
CREATE POLICY "Los agricultores pueden actualizar sus propios puntos de entrega"
  ON delivery_points
  FOR UPDATE
  USING (auth.uid() = farmer_id);

-- Política: Los agricultores pueden eliminar sus propios puntos de entrega
CREATE POLICY "Los agricultores pueden eliminar sus propios puntos de entrega"
  ON delivery_points
  FOR DELETE
  USING (auth.uid() = farmer_id);

-- Agregar columna delivery_point_id a la tabla orders si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'delivery_point_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_point_id UUID REFERENCES delivery_points(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_orders_delivery_point_id ON orders(delivery_point_id);
  END IF;
END $$;





