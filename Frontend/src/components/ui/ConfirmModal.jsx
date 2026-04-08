export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "danger" // "danger" (rojo) o "warning" (amarillo)
}) {
  if (!isOpen) return null;

  const buttonClass = type === "danger" 
    ? "bg-red-500 hover:bg-red-600" 
    : "bg-yellow-500 hover:bg-yellow-600";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d29] rounded-2xl p-4 sm:p-6 w-full max-w-sm border border-white/10">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">{title}</h2>
        <p className="text-white/70 mb-4 sm:mb-6 text-sm">{message}</p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 rounded-xl ${buttonClass} text-white font-medium transition`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
