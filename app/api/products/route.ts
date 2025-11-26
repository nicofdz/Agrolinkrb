import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";

// Función para calcular disponibilidad basada en stock
function calculateAvailability(stock: number): "Alta" | "Media" | "Baja" {
  if (stock > 100) {
    return "Alta";
  } else if (stock >= 40) {
    return "Media";
  } else {
    return "Baja";
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const onlyActive = searchParams.get("only_active") === "true";

    let query = supabase
      .from("products")
      .select("*");

    // Filtrar por usuario si se proporciona
    if (userId) {
      query = query.eq("user_id", userId);
    }

    // Filtrar solo activos si se solicita
    if (onlyActive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    // Obtener nombres de los vendedores para cada producto
    if (data && data.length > 0) {
      const productsWithSeller = await Promise.all(
        data.map(async (product: any) => {
          if (product.user_id) {
            try {
              const { data: sellerName, error: nameError } = await supabase.rpc('get_user_name', {
                user_id_param: product.user_id
              });
              
              if (!nameError && sellerName) {
                product.seller_name = sellerName;
                console.log(`[PRODUCTS] Producto ${product.name}: vendedor = ${sellerName}`);
              } else {
                console.warn(`[PRODUCTS] No se pudo obtener nombre para producto ${product.name}, user_id: ${product.user_id}`, nameError);
                product.seller_name = null;
              }
            } catch (e) {
              console.error(`[PRODUCTS] Error al obtener nombre del vendedor para producto ${product.name}:`, e);
              product.seller_name = null;
            }
          } else {
            console.warn(`[PRODUCTS] Producto ${product.name} no tiene user_id`);
            product.seller_name = null;
          }
          return product;
        })
      );
      
      return NextResponse.json(productsWithSeller, { status: 200 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener productos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      user_id,
      name, 
      category, 
      harvest_window, 
      price_range, 
      availability, 
      sustainability, 
      highlights, 
      location, 
      image_url,
      stock = 0,
      is_active = true
    } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id es requerido" },
        { status: 400 }
      );
    }

    // Calcular disponibilidad automáticamente basada en stock
    const calculatedAvailability = calculateAvailability(stock || 0);

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          user_id,
          name,
          category,
          harvest_window,
          price_range,
          availability: calculatedAvailability,
          sustainability,
          highlights: highlights || [],
          location: location || "Osorno",
          image_url: image_url || null,
          stock: stock || 0,
          is_active: is_active !== undefined ? is_active : true,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al crear producto" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      user_id,
      name, 
      category, 
      harvest_window, 
      price_range, 
      availability, 
      sustainability, 
      highlights, 
      location, 
      image_url,
      stock,
      is_active
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de producto es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el producto pertenece al usuario si se proporciona user_id
    if (user_id) {
      const { data: existingProduct, error: checkError } = await supabase
        .from("products")
        .select("user_id")
        .eq("id", id)
        .single();

      if (checkError) throw checkError;

      if (existingProduct?.user_id !== user_id) {
        return NextResponse.json(
          { error: "No tienes permiso para modificar este producto" },
          { status: 403 }
        );
      }
    }

    // Obtener el stock actual si no se proporciona en el body
    let currentStock = stock;
    if (stock === undefined) {
      const { data: existingProduct } = await supabase
        .from("products")
        .select("stock")
        .eq("id", id)
        .single();
      currentStock = existingProduct?.stock || 0;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (harvest_window !== undefined) updateData.harvest_window = harvest_window;
    if (price_range !== undefined) updateData.price_range = price_range;
    // Calcular disponibilidad automáticamente cuando se actualiza el stock
    if (stock !== undefined) {
      updateData.stock = stock;
      updateData.availability = calculateAvailability(stock);
    } else if (availability !== undefined) {
      // Si se proporciona availability manualmente pero no stock, mantenerlo
      updateData.availability = availability;
    }
    if (sustainability !== undefined) updateData.sustainability = sustainability;
    if (highlights !== undefined) updateData.highlights = highlights;
    if (location !== undefined) updateData.location = location;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al actualizar producto" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("user_id");

    if (!id) {
      return NextResponse.json(
        { error: "ID de producto requerido" },
        { status: 400 }
      );
    }

    // Verificar que el producto pertenece al usuario si se proporciona user_id
    if (userId) {
      const { data: existingProduct, error: checkError } = await supabase
        .from("products")
        .select("user_id")
        .eq("id", id)
        .single();

      if (checkError) throw checkError;

      if (existingProduct?.user_id !== userId) {
        return NextResponse.json(
          { error: "No tienes permiso para eliminar este producto" },
          { status: 403 }
        );
      }
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al eliminar producto" },
      { status: 500 }
    );
  }
}

