export default function AuthLayout({ title, children, footer }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white border rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-semibold text-center mb-6">
          {title}
        </h1>

        {children}

        {footer && (
          <div className="mt-6 text-sm text-center text-gray-500">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
