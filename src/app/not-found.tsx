import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-surface text-on-surface">
      <div className="px-4 text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="text-on-surface-variant">Página no encontrada · Page not found</p>
        <Link href="/" className="mt-6 inline-block font-semibold text-primary hover:underline">
          Volver al inicio · Back to home
        </Link>
      </div>
    </div>
  );
}
