import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";

// Obtener perfil del agricultor
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

    const { data, error } = await supabase
      .from("farmer_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw error;
    }

    // Si no existe perfil, devolver null
    return NextResponse.json(data || null, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener perfil" },
      { status: 500 }
    );
  }
}

// Crear o actualizar perfil del agricultor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      bio,
      location,
      phone,
      website,
      social_media,
      certifications,
      specialties,
    } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id es requerido" },
        { status: 400 }
      );
    }

    // Verificar si el perfil ya existe
    const { data: existingProfile } = await supabase
      .from("farmer_profiles")
      .select("id")
      .eq("user_id", user_id)
      .single();

    let result;
    if (existingProfile) {
      // Actualizar perfil existente
      const { data, error } = await supabase
        .from("farmer_profiles")
        .update({
          bio: bio || null,
          location: location || null,
          phone: phone || null,
          website: website || null,
          social_media: social_media || {},
          certifications: certifications || [],
          specialties: specialties || [],
        })
        .eq("user_id", user_id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Crear nuevo perfil
      const { data, error } = await supabase
        .from("farmer_profiles")
        .insert([
          {
            user_id,
            bio: bio || null,
            location: location || null,
            phone: phone || null,
            website: website || null,
            social_media: social_media || {},
            certifications: certifications || [],
            specialties: specialties || [],
          },
        ])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al guardar perfil" },
      { status: 500 }
    );
  }
}


