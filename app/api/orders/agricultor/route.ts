import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

// Obtener pedidos que contienen productos del agricultor
export async function GET() {
  try {
    // Obtener todos los pedidos con sus items, productos y punto de entrega
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (*)
        ),
        delivery_points (
          id,
          name,
          address,
          zone,
          latitude,
          longitude
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Filtrar pedidos que tienen productos (todos los productos son de agricultores en este caso)
    // En el futuro, cuando haya productores específicos, se filtraría por productor
    const filteredOrders = orders?.filter((order: any) => 
      order.order_items && order.order_items.length > 0
    ) || [];

    return NextResponse.json(filteredOrders, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener pedidos" },
      { status: 500 }
    );
  }
}


