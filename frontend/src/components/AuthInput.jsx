export default function AuthInput({ label, ...props }) {
  return (
    <div className="mb-4">
      <label className="block text-sm mb-1 text-gray-600">
        {label}
      </label>
      <input
        {...props}
        className="w-full px-3 py-2 border rounded-md
                   focus:outline-none focus:ring-2
                   focus:ring-black focus:border-black"
      />
    </div>
  );
}
