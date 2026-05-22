export default function AuthCallbackPage() {
  return (
    <div className="section-padding pt-24">
      <div className="container-wide">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-warm-300 border-t-purple-600" />
          <p className="mt-4 text-warm-600">Signing you in...</p>
        </div>
      </div>
    </div>
  );
}
