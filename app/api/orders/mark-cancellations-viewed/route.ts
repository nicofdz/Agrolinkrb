import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

// Marcar pedidos cancelados como vistos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id es requerido" },
        { status: 400 }
      );
    }

    // Marcar todos los pedidos cancelados del usuario como vistos (incluyendo NULL)
    const { data, error } = await supabase
      .from("orders")
      .update({ cancellation_viewed: true })
      .eq("user_id", user_id)
      .eq("status", "cancelado")
      .or("cancellation_viewed.is.null,cancellation_viewed.eq.false")
      .select();

    if (error) throw error;

    return NextResponse.json(
      { message: "Pedidos cancelados marcados como vistos", count: data?.length || 0 },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al marcar pedidos como vistos" },
      { status: 500 }
    );
  }
}

