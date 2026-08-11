export type RolMensaje = 'agente' | 'cliente';

export interface Mensaje {
  id: number;
  rol: RolMensaje;
  contenido: string;
  creado_en: string;
}
