// MAPPERS: Transformación de DTOs del backend a modelos del frontend

interface CategoriaDTO {
  id: number;
  label?: string;
  nombre?: string;
  key?: string;
  color?: string;
  bg_color?: string;
  bgColor?: string;
  text_color?: string;
  icon?: string;
  icono?: string;
  orden?: number;
}

interface OrganizacionDTO {
  id: number;
  nombre?: string;
  descripcion?: string;
  tipo?: string;
  ciudad?: string;
  direccion?: string;
  telefono?: string;
  web?: string;
  url?: string;
  email?: string;
  logo_url?: string;
  logo?: string;
  servicios?: string[];
  organizaciones_categorias_id?: number;
}

export const mapCategoriasDTO = (categorias: any[]) => {
  if (!Array.isArray(categorias)) return [];
  return categorias.map((cat) => ({
    id: cat.id || 0,
    label: cat.label || cat.nombre || "",
    key: cat.key || cat.nombre || "",
    color: cat.color || "",
    bg_color: cat.bg_color || cat.bgColor || "",
    text_color: cat.text_color || "",
    icono: cat.icon || cat.icono || "",
    nombre: cat.nombre || "",
    orden: cat.orden || 0
  }));
};

export const mapOrganizacionesDTO = (organizaciones: any[]) => {
  if (!Array.isArray(organizaciones)) return [];
  return organizaciones.map((org) => ({
    id: org.id || 0,
    nombre: org.nombre || "",
    descripcion: org.descripcion || "",
    tipo: org.tipo || "",
    ciudad: org.ciudad || "",
    direccion: org.direccion || "",
    telefono: org.telefono || "",
    web: org.web || org.url || "",
    email: org.email || "",
    logo_url: org.logo_url || org.logo || "",
    servicios: org.servicios || [],
    categoriaId: org.organizaciones_categorias_id || 0,
    estado: org.estado ?? null,
  }));
};
