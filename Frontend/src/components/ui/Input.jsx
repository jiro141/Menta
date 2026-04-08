export default function Input({ label, error, maxLength, ...props }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-200">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          {...props}
          maxLength={maxLength}
          className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none placeholder:text-slate-400 focus:border-emerald-400"
        />
        {maxLength && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            {props.value?.length || 0}/{maxLength}
          </span>
        )}
      </div>
      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}
    </div>
  );
}