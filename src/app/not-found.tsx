import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50 dark:bg-warm-950">
      <div className="text-center px-4">
        <h1 className="text-fluid-hero font-heading font-bold text-purple-700 mb-4">
          404
        </h1>
        <h2 className="text-fluid-2xl font-heading font-semibold text-warm-900 dark:text-warm-50 mb-4">
          Page Not Found
        </h2>
        <p className="text-warm-600 dark:text-warm-400 mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let us help you find your way.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-700 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
