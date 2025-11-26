import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";

// Obtener lista de todos los agricultores con sus perfiles
export async function GET(request: NextRequest) {
  try {
    // Obtener TODOS los usuarios que son agricultores usando SQL directo
    const { data: farmersData, error: sqlError } = await supabase.rpc('get_all_farmers');
    
    if (sqlError || !farmersData) {
      // Si la función RPC no existe, usar método alternativo
      console.warn("Función RPC no disponible, usando método alternativo");
      return await getFarmersAlternative();
    }

    // Obtener perfiles y productos para cada agricultor
    const farmersWithDetails = await Promise.all(
      farmersData.map(async (farmer: any) => {
        const userId = farmer.id;
        const userName = farmer.name || farmer.email?.split("@")[0] || "Agricultor";

        try {
          // Obtener perfil del agricultor si existe
          const { data: profile, error: profileError } = await supabase
            .from("farmer_profiles")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

          // Contar productos activos del agricultor
          const { count: productsCount } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("is_active", true);

          return {
            user_id: userId,
            name: userName,
            location: profile?.location || "No especificado",
            bio: profile?.bio || null,
            phone: profile?.phone || null,
            website: profile?.website || null,
            certifications: profile?.certifications || [],
            specialties: profile?.specialties || [],
            products_count: productsCount || 0,
            created_at: profile?.created_at || farmer.created_at,
          };
        } catch (error) {
          console.error(`Error al obtener detalles del agricultor ${userName}:`, error);
          return {
            user_id: userId,
            name: userName,
            location: "No especificado",
            bio: null,
            phone: null,
            website: null,
            certifications: [],
            specialties: [],
            products_count: 0,
            created_at: farmer.created_at,
          };
        }
      })
    );

    return NextResponse.json(farmersWithDetails, { status: 200 });
  } catch (error: any) {
    console.error("Error en método principal, intentando método alternativo:", error);
    return await getFarmersAlternative();
  }
}

// Método alternativo: obtener desde farmer_profiles y productos
async function getFarmersAlternative() {
  try {
    // Obtener todos los perfiles de agricultores
    const { data: profiles, error: profilesError } = await supabase
      .from("farmer_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) throw profilesError;

    const farmerIds = new Set<string>();
    const farmersMap = new Map<string, any>();

    // Procesar perfiles existentes
    if (profiles) {
      for (const profile of profiles) {
        farmerIds.add(profile.user_id);
        try {
          const { data: userName } = await supabase.rpc('get_user_name', {
            user_id_param: profile.user_id
          });

          const { count: productsCount } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.user_id)
            .eq("is_active", true);

          farmersMap.set(profile.user_id, {
            user_id: profile.user_id,
            name: userName || "Agricultor",
            location: profile.location || "No especificado",
            bio: profile.bio || null,
            phone: profile.phone || null,
            website: profile.website || null,
            certifications: profile.certifications || [],
            specialties: profile.specialties || [],
            products_count: productsCount || 0,
            created_at: profile.created_at,
          });
        } catch (error) {
          console.error(`Error procesando perfil ${profile.user_id}:`, error);
        }
      }
    }

    // Obtener todos los productos para encontrar agricultores sin perfil
    const { data: products } = await supabase
      .from("products")
      .select("user_id")
      .eq("is_active", true);

    if (products) {
      const uniqueUserIds = [...new Set(products.map((p: any) => p.user_id).filter((id: any) => id))];
      
      for (const userId of uniqueUserIds) {
        if (!farmerIds.has(userId)) {
          try {
            const { data: userName } = await supabase.rpc('get_user_name', {
              user_id_param: userId
            });

            const { count: productsCount } = await supabase
              .from("products")
              .select("*", { count: "exact", head: true })
              .eq("user_id", userId)
              .eq("is_active", true);

            farmersMap.set(userId, {
              user_id: userId,
              name: userName || "Agricultor",
              location: "No especificado",
              bio: null,
              phone: null,
              website: null,
              certifications: [],
              specialties: [],
              products_count: productsCount || 0,
              created_at: null,
            });
          } catch (error) {
            console.error(`Error procesando agricultor sin perfil ${userId}:`, error);
          }
        }
      }
    }

    const farmersWithDetails = Array.from(farmersMap.values());
    return NextResponse.json(farmersWithDetails, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener agricultores" },
      { status: 500 }
    );
  }
}

