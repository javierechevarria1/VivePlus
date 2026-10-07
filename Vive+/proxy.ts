import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function proxy(req: NextRequest) {
  if (process.env.LOCAL_DEMO === "true") return NextResponse.next();

  const { pathname } = req.nextUrl;

  
  const ORG_ALLOWED = ["/", "/organizaciones", "/sobre-nosotros"];
  const isOrgBlockable = [
    "/comunidad", "/recursos", "/segunda-mano",
    "/contacto", "/planes", "/mis-chats", "/panel-cuidador", "/admin-",
  ].some(r => pathname.startsWith(r));

  const isMedicoBlockable = [
    "/comunidad", "/recursos", "/segunda-mano",
    "/contacto", "/planes", "/mis-chats", "/marketplace", "/admin-",
  ].some(r => pathname.startsWith(r));

  // La cuenta de médico es de trabajo: no compra ni vende. La tienda le queda
  // cerrada tenga plan o no, que es lo que la distingue del bloqueo de abajo
  // (ese solo aparta al médico que aún no ha completado su alta).
  const isTienda = [
    "/marketplace", "/segunda-mano", "/mis-pedidos",
  ].some(r => pathname.startsWith(r));

  if (isOrgBlockable || isMedicoBlockable || isTienda) {
    const token = req.cookies.get("r65_token")?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (isTienda && payload.rol === "medico") {
          return NextResponse.redirect(new URL("/", req.url));
        }
        if (isOrgBlockable && payload.rol === "usuario_organizacion") {
          return NextResponse.redirect(new URL("/organizaciones", req.url));
        }
        if (isMedicoBlockable && payload.rol === "medico" && payload.plan_activo === false) {
          return NextResponse.redirect(new URL("/panel-cuidador", req.url));
        }
      } catch { }
    }
  }


  if (pathname.startsWith("/panel-cuidador")) {
    const token = req.cookies.get("r65_token")?.value;

    if (!token) {
      console.log("[Proxy] No hay token, redirigiendo a login");
      return NextResponse.redirect(new URL("/?error=unauthorized", req.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch (err) {
      console.error("[Proxy] Error validando token:", err);
      return NextResponse.redirect(new URL("/?error=invalid-token", req.url));
    }
  }


  if (pathname.startsWith("/admin-marketplace") || pathname.startsWith("/admin-actividades") || pathname.startsWith("/admin-organizaciones") || pathname.startsWith("/admin-codigos") || pathname.startsWith("/admin-cuidadores")) {
    const token = req.cookies.get("r65_token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/?error=unauthorized", req.url));
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.rol !== "admin") {
        return NextResponse.redirect(new URL("/?error=forbidden", req.url));
      }
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/?error=invalid-token", req.url));
    }
  }

  
  if (pathname === "/contacto" || pathname.startsWith("/comunidad")) {
    const token = req.cookies.get("r65_token")?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.rol === "admin") {
          return NextResponse.redirect(new URL("/admin-marketplace", req.url));
        }
      } catch {  }
    }
  }

  if (pathname.startsWith("/admin-") && !pathname.startsWith("/admin-marketplace") && !pathname.startsWith("/admin-actividades") && !pathname.startsWith("/admin-organizaciones")) {
    const token = req.cookies.get("r65_token")?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.rol !== "admin") {
          return NextResponse.redirect(new URL("/", req.url));
        }
      } catch { /* token inválido, dejar pasar */ }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/panel-cuidador/:path*",
    "/admin-marketplace/:path*", "/admin-marketplace",
    "/admin-actividades/:path*", "/admin-actividades",
    "/admin-organizaciones/:path*", "/admin-organizaciones",
    "/admin-anuncios/:path*", "/admin-anuncios",
    "/admin-codigos/:path*", "/admin-codigos",
    "/admin-cuidadores/:path*", "/admin-cuidadores",
    "/admin-categorias/:path*", "/admin-categorias",
    "/admin-salud/:path*", "/admin-salud",
    "/admin-planes/:path*", "/admin-planes",
    "/contacto",
    "/comunidad", "/comunidad/:path*",
    "/segunda-mano", "/segunda-mano/:path*",
    "/salud", "/salud/:path*",
    "/recursos", "/recursos/:path*",
    "/marketplace", "/marketplace/:path*",
    "/mis-pedidos", "/mis-pedidos/:path*",
    "/planes", "/planes/:path*",
    "/mis-chats", "/mis-chats/:path*",
  ],
};
