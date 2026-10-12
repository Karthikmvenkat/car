import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="pt-32 pb-20 min-h-screen flex items-center">
      <div className="container-main w-full">
        <div className="max-w-md mx-auto text-center">
          <p className="text-display-xl font-bold text-primary-accent mb-4">
            404
          </p>
          <h1 className="text-display-md font-bold text-primary-text tracking-tight mb-4">
            Page Not Found
          </h1>
          <p className="text-body-lg text-primary-muted mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/" className="btn-primary px-8 py-3.5">
              Go Home
            </Link>
            <Link href="/vehicles" className="btn-secondary px-8 py-3.5">
              Browse Vehicles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
