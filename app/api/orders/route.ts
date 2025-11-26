import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";

async function sendEmail(to: string, subject: string, html: string, text: string) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  console.log(`[EMAIL] Iniciando envío de email a: ${to}`);
  console.log(`[EMAIL] RESEND_API_KEY configurado: ${RESEND_API_KEY ? "Sí" : "No"}`);
  
  if (RESEND_API_KEY) {
    try {
      console.log(`[EMAIL] Enviando email a través de Resend API...`);
      
      // Crear un AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
      
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "AgroLink <onboarding@resend.dev>",
            to: [to],
            subject: subject,
            html: html,
            text: text,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const responseData = await response.json();
        
        if (!response.ok) {
          console.error(`[EMAIL] Error de Resend API (${response.status}):`, responseData);
          throw new Error(responseData.message || `Error ${response.status}: Error al enviar email`);
        }

        console.log(`[EMAIL] Email enviado exitosamente. ID: ${responseData.id}`);
        return responseData;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error("[EMAIL] Timeout al enviar email: La solicitud tardó más de 10 segundos");
          throw new Error("Timeout: La solicitud de envío de email tardó demasiado");
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("[EMAIL] Error al enviar email:", error);
      if (error instanceof Error) {
        console.error("[EMAIL] Mensaje de error:", error.message);
        console.error("[EMAIL] Stack:", error.stack);
      }
      // No lanzar el error para que no falle la creación del pedido
      // Solo loguear el error
      return { 
        id: "error", 
        message: error instanceof Error ? error.message : "Error desconocido al enviar email",
        error: true
      };
    }
  } else {
    // Modo desarrollo - solo log
    console.log("=== EMAIL (desarrollo - configure RESEND_API_KEY) ===");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Body:", text);
    console.log("=====================================================");
    return { id: "dev-mode", message: "Email no enviado - RESEND_API_KEY no configurado" };
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
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

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener pedidos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      customer_name,
      customer_email,
      customer_phone,
      delivery_slot,
      logistics_option,
      delivery_point_id,
      notes,
      items, // Array de { product_id, quantity }
    } = body;

    // Validar que haya items
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "El pedido debe contener al menos un producto" },
        { status: 400 }
      );
    }

    // 1. Validar stock y obtener información de productos
    const productIds = items.map((item: any) => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, stock, user_id")
      .in("id", productIds);

    if (productsError) throw productsError;

    // Validar que todos los productos existan
    if (!products || products.length !== productIds.length) {
      return NextResponse.json(
        { error: "Uno o más productos no fueron encontrados" },
        { status: 400 }
      );
    }

    // Validar stock suficiente
    for (const item of items) {
      const product = products.find((p: any) => p.id === item.product_id);
      if (!product) {
        return NextResponse.json(
          { error: `Producto ${item.product_id} no encontrado` },
          { status: 400 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}` },
          { status: 400 }
        );
      }
    }

    // 2. Disminuir stock de productos y actualizar disponibilidad
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

    for (const item of items) {
      const product = products.find((p: any) => p.id === item.product_id);
      if (product) {
        const newStock = product.stock - item.quantity;
        const newAvailability = calculateAvailability(newStock);
        const { error: updateStockError } = await supabase
          .from("products")
          .update({ stock: newStock, availability: newAvailability })
          .eq("id", item.product_id);

        if (updateStockError) {
          console.error(`Error al actualizar stock del producto ${item.product_id}:`, updateStockError);
          throw updateStockError;
        }
      }
    }

    // 3. Crear el pedido
    const orderData: any = {
      user_id: user_id || null,
      customer_name: customer_name || null,
      customer_email: customer_email || null,
      customer_phone: customer_phone || null,
      delivery_slot,
      logistics_option,
      notes: notes || null,
      total_items: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      status: "pendiente",
    };

    // Agregar delivery_point_id si se proporciona
    if (delivery_point_id) {
      orderData.delivery_point_id = delivery_point_id;
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([orderData])
      .select()
      .single();

    if (orderError) throw orderError;

    // 4. Crear los items del pedido
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // 5. Obtener el pedido completo con items y productos
    const { data: fullOrder, error: fetchError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq("id", order.id)
      .single();

    if (fetchError) throw fetchError;

    // 6. Obtener emails de agricultores y enviar notificaciones
    const farmerIds = [...new Set(products.map((p: any) => p.user_id).filter((id: any) => id))];
    
    if (farmerIds.length > 0) {
      // Agrupar productos por agricultor
      const productsByFarmer: Record<string, any[]> = {};
      for (const item of items) {
        const product = products.find((p: any) => p.id === item.product_id);
        if (product && product.user_id) {
          if (!productsByFarmer[product.user_id]) {
            productsByFarmer[product.user_id] = [];
          }
          productsByFarmer[product.user_id].push({
            name: product.name,
            quantity: item.quantity,
          });
        }
      }

      // Obtener emails de agricultores usando función SQL
      for (const farmerId of farmerIds) {
        try {
          // Usar función SQL para obtener el email del usuario
          const { data: farmerEmail, error: farmerError } = await supabase.rpc('get_user_email', {
            user_id_param: farmerId
          });

          if (!farmerError && farmerEmail) {
            const farmerProducts = productsByFarmer[farmerId] || [];
            
            const orderItemsText = farmerProducts
              .map((p: any) => `- ${p.name} (${p.quantity} unidades)`)
              .join("\n");

            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #059669;">Nuevo Pedido Recibido</h2>
                <p>Estimado/a agricultor,</p>
                <p>Has recibido un nuevo pedido <strong>#${order.id.substring(0, 8)}</strong> en AgroLink.</p>
                
                <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0;">
                  <h3 style="margin: 0 0 12px 0; color: #059669;">Detalles del pedido:</h3>
                  <ul style="margin: 0; padding-left: 20px;">
                    <li><strong>Fecha:</strong> ${new Date(order.created_at).toLocaleDateString("es-ES")}</li>
                    <li><strong>Cliente:</strong> ${customer_name || "No especificado"}</li>
                    <li><strong>Email:</strong> ${customer_email || "No especificado"}</li>
                    <li><strong>Teléfono:</strong> ${customer_phone || "No especificado"}</li>
                    <li><strong>Horario de entrega:</strong> ${delivery_slot}</li>
                    <li><strong>Opción logística:</strong> ${logistics_option}</li>
                    ${notes ? `<li><strong>Notas:</strong> ${notes}</li>` : ""}
                  </ul>
                </div>

                <h3 style="color: #059669; margin-top: 24px;">Tus productos en este pedido:</h3>
                <pre style="background-color: #f3f4f6; padding: 12px; border-radius: 4px; white-space: pre-wrap;">${orderItemsText}</pre>

                <p style="margin-top: 24px;">Por favor, revisa el pedido en tu panel de agricultores y confirma la disponibilidad.</p>
                
                <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
                  Saludos,<br>
                  Equipo AgroLink
                </p>
              </div>
            `;

            const emailText = `
Nuevo Pedido Recibido

Estimado/a agricultor,

Has recibido un nuevo pedido #${order.id.substring(0, 8)} en AgroLink.

Detalles del pedido:
- Fecha: ${new Date(order.created_at).toLocaleDateString("es-ES")}
- Cliente: ${customer_name || "No especificado"}
- Email: ${customer_email || "No especificado"}
- Teléfono: ${customer_phone || "No especificado"}
- Horario de entrega: ${delivery_slot}
- Opción logística: ${logistics_option}
${notes ? `- Notas: ${notes}` : ""}

Tus productos en este pedido:
${orderItemsText}

Por favor, revisa el pedido en tu panel de agricultores y confirma la disponibilidad.

Saludos,
Equipo AgroLink
            `;

            // Enviar email de forma asíncrona (no bloquear la creación del pedido)
            sendEmail(
              farmerEmail,
              `Nuevo pedido #${order.id.substring(0, 8)} - AgroLink`,
              emailHtml,
              emailText
            )
            .then((result) => {
              if (result && result.error) {
                console.error(`[EMAIL] Error al enviar email a agricultor ${farmerEmail}:`, result.message);
              } else {
                console.log(`[EMAIL] Email enviado exitosamente a agricultor ${farmerEmail}:`, result);
              }
            })
            .catch((err) => {
              console.error(`[EMAIL] Error inesperado al enviar email a agricultor ${farmerEmail}:`, err);
              // No fallar la creación del pedido si falla el email
            });
          } else {
            console.warn(`[EMAIL] No se pudo obtener el email del agricultor ${farmerId}`);
          }
        } catch (error) {
          console.error(`[EMAIL] Error al obtener datos del agricultor ${farmerId}:`, error);
          // Continuar con otros agricultores aunque falle uno
        }
      }
    }

    return NextResponse.json(fullOrder, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al crear pedido" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, cancellation_reason } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID y status son requeridos" },
        { status: 400 }
      );
    }

    // Si se está cancelando, el motivo es requerido
    if (status === "cancelado" && !cancellation_reason) {
      return NextResponse.json(
        { error: "El motivo de cancelación es requerido" },
        { status: 400 }
      );
    }

    // Obtener el estado actual del pedido antes de actualizarlo
    const { data: currentOrder, error: currentOrderError } = await supabase
      .from("orders")
      .select("status")
      .eq("id", id)
      .single();

    if (currentOrderError) throw currentOrderError;

    const previousStatus = currentOrder?.status;
    const isNewlyCancelled = status === "cancelado" && previousStatus !== "cancelado";

    const updateData: any = { status };
    if (status === "cancelado" && cancellation_reason) {
      updateData.cancellation_reason = cancellation_reason;
    } else if (status !== "cancelado") {
      // Si no se está cancelando, limpiar el motivo de cancelación
      updateData.cancellation_reason = null;
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .single();

    if (error) throw error;

    // Si se canceló el pedido (y no estaba cancelado antes), restaurar el stock de los productos
    if (isNewlyCancelled && data.order_items && data.order_items.length > 0) {
      console.log(`[STOCK] Restaurando stock para pedido cancelado ${id}`);
      
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

      // Restaurar stock de cada producto
      for (const item of data.order_items) {
        if (item.product_id && item.quantity) {
          try {
            // Obtener el stock actual del producto
            const { data: productData, error: productError } = await supabase
              .from("products")
              .select("stock")
              .eq("id", item.product_id)
              .single();

            if (productError) {
              console.error(`[STOCK] Error al obtener stock del producto ${item.product_id}:`, productError);
              continue;
            }

            const currentStock = productData?.stock || 0;
            const newStock = currentStock + item.quantity;
            const newAvailability = calculateAvailability(newStock);

            // Actualizar stock y disponibilidad
            const { error: updateError } = await supabase
              .from("products")
              .update({ 
                stock: newStock,
                availability: newAvailability
              })
              .eq("id", item.product_id);

            if (updateError) {
              console.error(`[STOCK] Error al restaurar stock del producto ${item.product_id}:`, updateError);
            } else {
              console.log(`[STOCK] Stock restaurado para producto ${item.product_id}: ${currentStock} -> ${newStock} unidades`);
            }
          } catch (error) {
            console.error(`[STOCK] Error al procesar restauración de stock para producto ${item.product_id}:`, error);
          }
        }
      }
    }

    // Si se canceló el pedido, enviar email de notificación al cliente
    if (status === "cancelado" && data.customer_email) {
      try {
        console.log(`[EMAIL] Intentando enviar email de cancelación a: ${data.customer_email}`);
        console.log(`[EMAIL] Pedido ID: ${data.id}`);
        
        const orderItemsText = data.order_items
          ?.map((item: any) => `- ${item.products?.name || "Producto"} (${item.quantity} unidades)`)
          .join("\n") || "No hay productos";

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Notificación de Cancelación de Pedido</h2>
            <p>Estimado/a ${data.customer_name || "Cliente"},</p>
            <p>Lamentamos informarle que su pedido <strong>#${data.id.substring(0, 8)}</strong> ha sido cancelado.</p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #991b1b;">Motivo de cancelación:</p>
              <p style="margin: 8px 0 0 0; color: #7f1d1d;">${cancellation_reason}</p>
            </div>

            <h3 style="color: #059669; margin-top: 24px;">Detalles del pedido:</h3>
            <ul>
              <li><strong>Fecha:</strong> ${new Date(data.created_at).toLocaleDateString("es-ES")}</li>
              <li><strong>Productos:</strong></li>
              <pre style="background-color: #f3f4f6; padding: 12px; border-radius: 4px;">${orderItemsText}</pre>
            </ul>

            <p style="margin-top: 24px;">Si tiene alguna pregunta o necesita más información, no dude en contactarnos.</p>
            
            <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
              Saludos,<br>
              Equipo AgroLink
            </p>
          </div>
        `;

        const emailText = `
Notificación de Cancelación de Pedido

Estimado/a ${data.customer_name || "Cliente"},

Lamentamos informarle que su pedido #${data.id.substring(0, 8)} ha sido cancelado.

Motivo de cancelación:
${cancellation_reason}

Detalles del pedido:
- Fecha: ${new Date(data.created_at).toLocaleDateString("es-ES")}
- Productos:
${orderItemsText}

Si tiene alguna pregunta o necesita más información, no dude en contactarnos.

Saludos,
Equipo AgroLink
        `;

        // Enviar email de forma asíncrona (no esperar respuesta)
        sendEmail(
          data.customer_email,
          `Pedido #${data.id.substring(0, 8)} cancelado - AgroLink`,
          emailHtml,
          emailText
        )
        .then((result) => {
          if (result && result.error) {
            console.error(`[EMAIL] Error al enviar email de cancelación a ${data.customer_email}:`, result.message);
          } else {
            console.log(`[EMAIL] Email enviado exitosamente a ${data.customer_email}:`, result);
          }
        })
        .catch((err) => {
          console.error(`[EMAIL] Error inesperado al enviar email de cancelación a ${data.customer_email}:`, err);
          // No fallar la actualización del pedido si falla el email
        });
      } catch (emailError) {
        console.error("[EMAIL] Error al preparar email de cancelación:", emailError);
        console.error("[EMAIL] Stack trace:", emailError instanceof Error ? emailError.stack : "N/A");
        // No fallar la actualización del pedido si falla el email
      }
    } else if (status === "cancelado" && !data.customer_email) {
      console.warn(`[EMAIL] No se puede enviar email de cancelación: el pedido ${data.id} no tiene customer_email`);
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al actualizar pedido" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("id");
    const userId = searchParams.get("user_id");

    if (!orderId || !userId) {
      return NextResponse.json(
        { error: "ID del pedido y user_id son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el pedido pertenece al usuario y está cancelado
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, user_id")
      .eq("id", orderId)
      .single();

    if (fetchError) throw fetchError;

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (order.user_id !== userId) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar este pedido" },
        { status: 403 }
      );
    }

    if (order.status !== "cancelado") {
      return NextResponse.json(
        { error: "Solo se pueden eliminar pedidos cancelados" },
        { status: 400 }
      );
    }

    // Eliminar primero los order_items (cascada)
    const { error: itemsError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId);

    if (itemsError) throw itemsError;

    // Eliminar el pedido
    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (deleteError) throw deleteError;

    return NextResponse.json(
      { message: "Pedido eliminado correctamente" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al eliminar pedido" },
      { status: 500 }
    );
  }
}

