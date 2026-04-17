export default function Button({ children, ...props }) {
  return (
    <button
      {...props}
      className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition"
    >
      {children}
    </button>
  );
}