import type { ProgresoBloque } from '@/types/ficha';

// docs/design-system.md: lateral en escritorio, superior en móvil. Muestra
// qué bloques llevan datos — reduce el abandono al convertir una duración
// desconocida en algo que avanza.
export function Progreso({ bloques }: { bloques: ProgresoBloque[] }) {
  return (
    <div
      className="flex shrink-0 gap-2 overflow-x-auto border-b border-zinc-200 bg-white px-4 py-3 sm:w-56 sm:flex-col sm:gap-1 sm:overflow-visible sm:border-b-0 sm:border-r sm:py-6 dark:border-zinc-800 dark:bg-black"
      aria-label="Progreso de la entrevista"
    >
      {bloques.map((bloque) => (
        <div
          key={bloque.numero}
          className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm sm:whitespace-normal"
        >
          <span
            aria-hidden
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${
              bloque.completo
                ? 'bg-foreground text-background'
                : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500'
            }`}
          >
            {bloque.completo ? '✓' : bloque.numero}
          </span>
          <span className={bloque.completo ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-500'}>
            {bloque.titulo}
          </span>
        </div>
      ))}
    </div>
  );
}
