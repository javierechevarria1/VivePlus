import httpClient from '../api/httpClient';
import { mapCategoriasDTO, mapOrganizacionesDTO } from '../mappers/dtoMapper';

// SERVICES: Casos de uso y orquestación
export const apiService = {
  // Ejemplos para Organizaciones
  async getCategoriasOrganizaciones() {
    const { data } = await httpClient.get('/categorias?tipo=organizaciones');
    return mapCategoriasDTO(data.categorias);
  },

  async getOrganizaciones() {
    const { data } = await httpClient.get('/organizaciones');
    return mapOrganizacionesDTO(data.organizaciones);
  },

  // Ejemplos para Salud (Médicos)
  async getCategoriasSalud() {
    const { data } = await httpClient.get('/categorias?tipo=salud');
    return mapCategoriasDTO(data.categorias);
  },

  async getMedicos() {
    const { data } = await httpClient.get('/salud');
    // Asumiendo que el endpoint de salud devuelve una lista de medicos (usuarios con rol medico)
    return data.medicos || data; 
  },
  
  // Puedes añadir aquí el resto de servicios a medida que migres la app
};
