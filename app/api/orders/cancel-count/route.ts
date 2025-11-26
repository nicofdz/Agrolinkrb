import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

// Obtener conteo de pedidos cancelados del usuario
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id es requerido" },
        { status: 400 }
      );
    }

    // Obtener conteo de pedidos cancelados no vistos (incluyendo NULL)
    const { count, error } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "cancelado")
      .or("cancellation_viewed.is.null,cancellation_viewed.eq.false");

    if (error) throw error;

    return NextResponse.json({ count: count || 0 }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener conteo" },
      { status: 500 }
    );
  }
}

