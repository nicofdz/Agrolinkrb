import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";

// Obtener puntos de entrega
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get("farmer_id");
    const zone = searchParams.get("zone");
    const activeOnly = searchParams.get("active_only") === "true";

    let query = supabase
      .from("delivery_points")
      .select("*")
      .order("created_at", { ascending: false });

    if (farmerId) {
      query = query.eq("farmer_id", farmerId);
    }

    if (zone) {
      query = query.eq("zone", zone);
    }

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data || [], { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener puntos de entrega" },
      { status: 500 }
    );
  }
}

// Crear punto de entrega
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { farmer_id, name, address, zone, latitude, longitude, is_active = true } = body;

    if (!farmer_id || !name || !address || !zone) {
      return NextResponse.json(
        { error: "farmer_id, name, address y zone son requeridos" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("delivery_points")
      .insert([
        {
          farmer_id,
          name,
          address,
          zone,
          latitude: latitude !== null && latitude !== undefined ? latitude : null,
          longitude: longitude !== null && longitude !== undefined ? longitude : null,
          is_active: is_active !== undefined ? is_active : true,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al crear punto de entrega" },
      { status: 500 }
    );
  }
}

// Actualizar punto de entrega
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, address, zone, latitude, longitude, is_active, farmer_id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id es requerido" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (zone !== undefined) updateData.zone = zone;
    if (latitude !== undefined) updateData.latitude = latitude !== null ? latitude : null;
    if (longitude !== undefined) updateData.longitude = longitude !== null ? longitude : null;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Verificar que el punto pertenece al agricultor
    if (farmer_id) {
      const { data: existingPoint, error: fetchError } = await supabase
        .from("delivery_points")
        .select("farmer_id")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      if (existingPoint?.farmer_id !== farmer_id) {
        return NextResponse.json(
          { error: "No tienes permiso para modificar este punto de entrega" },
          { status: 403 }
        );
      }
    }

    const { data, error } = await supabase
      .from("delivery_points")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al actualizar punto de entrega" },
      { status: 500 }
    );
  }
}

// Eliminar punto de entrega
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const farmerId = searchParams.get("farmer_id");

    if (!id) {
      return NextResponse.json(
        { error: "id es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el punto pertenece al agricultor
    if (farmerId) {
      const { data: existingPoint, error: fetchError } = await supabase
        .from("delivery_points")
        .select("farmer_id")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      if (existingPoint?.farmer_id !== farmerId) {
        return NextResponse.json(
          { error: "No tienes permiso para eliminar este punto de entrega" },
          { status: 403 }
        );
      }
    }

    const { error } = await supabase
      .from("delivery_points")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json(
      { message: "Punto de entrega eliminado correctamente" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al eliminar punto de entrega" },
      { status: 500 }
    );
  }
}

