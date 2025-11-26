import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

// Obtener pedidos del usuario autenticado
export async function GET(request: NextRequest) {
  try {
    // Obtener el user_id de los query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id es requerido" },
        { status: 400 }
      );
    }

    // Obtener pedidos del usuario
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(orders || [], { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener pedidos" },
      { status: 500 }
    );
  }
}

