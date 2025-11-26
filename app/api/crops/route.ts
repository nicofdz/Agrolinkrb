import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("crops")
      .select("*")
      .order("planted_date", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener cosechas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, planted_date, harvest_days, quantity, location, notes } = body;

    const { data, error } = await supabase
      .from("crops")
      .insert([
        {
          name,
          category,
          planted_date,
          harvest_days,
          quantity,
          location,
          notes: notes || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al crear cosecha" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, category, planted_date, harvest_days, quantity, location, notes } = body;

    const { data, error } = await supabase
      .from("crops")
      .update({
        name,
        category,
        planted_date,
        harvest_days,
        quantity,
        location,
        notes: notes || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al actualizar cosecha" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID de cosecha requerido" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("crops")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al eliminar cosecha" },
      { status: 500 }
    );
  }
}

