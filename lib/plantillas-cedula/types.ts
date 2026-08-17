export interface PlantillaCedulaUsuario {
  id: string;
  user_id: string;
  nombre: string;
  descripcion: string | null;
  storage_path: string;
  nombre_archivo: string;
  mime_type: string;
  tamano_bytes: number;
  created_at: string;
  updated_at: string;
}
