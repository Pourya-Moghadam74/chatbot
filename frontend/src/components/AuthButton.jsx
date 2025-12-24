export default function AuthButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="w-full bg-black text-white py-2 rounded-md
                 hover:bg-gray-900 transition disabled:opacity-50"
    >
      {children}
    </button>
  );
}
