import { NextRequest, NextResponse } from "next/server";

// Enviar email de notificación
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, text } = body;

    if (!to || !subject) {
      return NextResponse.json(
        { error: "to y subject son requeridos" },
        { status: 400 }
      );
    }

    // Usar un servicio de email externo o SMTP
    // Por ahora, usaremos una solución simple con fetch a un servicio de email
    // El usuario puede configurar su servicio preferido (Resend, SendGrid, etc.)
    
    // Opción 1: Usar Resend (recomendado)
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (RESEND_API_KEY) {
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
          html: html || text,
          text: text || html,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al enviar email");
      }

      const data = await response.json();
      return NextResponse.json({ success: true, id: data.id }, { status: 200 });
    }

    // Opción 2: Fallback - usar console.log para desarrollo
    // En producción, el usuario debe configurar RESEND_API_KEY
    console.log("=== EMAIL (desarrollo) ===");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Body:", text || html);
    console.log("========================");

    return NextResponse.json(
      { 
        success: true, 
        message: "Email enviado (modo desarrollo - configure RESEND_API_KEY para producción)" 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error al enviar email:", error);
    return NextResponse.json(
      { error: error.message || "Error al enviar email" },
      { status: 500 }
    );
  }
}

