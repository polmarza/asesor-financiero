import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex max-w-md flex-col items-center gap-6 px-6 text-center">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            ¿Vas bien encaminado con tu dinero?
          </h1>
          <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Cuéntanos tu situación en una conversación de cinco minutos y
            recibe un diagnóstico con tus números, explicado en cristiano.
            Sin formularios, sin coste.
          </p>
        </div>
        <Link
          href="/consentimiento"
          className="flex h-12 w-full max-w-xs items-center justify-center rounded-full bg-foreground px-5 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Empezar mi diagnóstico
        </Link>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          Orientación educativa, no asesoramiento financiero regulado.
        </p>
      </main>
    </div>
  );
}
