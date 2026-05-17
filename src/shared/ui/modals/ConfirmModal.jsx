export function ConfirmModal({ config, onClose }) {
  if (!config.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-3 text-slate-800">{config.title}</h3>
        <p className="text-slate-600 mb-8 whitespace-pre-line leading-relaxed">{config.message}</p>
        <div className="flex gap-3 justify-end">
          {config.onConfirm ? (
            <>
              <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">取消</button>
              <button onClick={config.onConfirm} className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md">确认执行</button>
            </>
          ) : (
            <button onClick={onClose} className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md">我知道了</button>
          )}
        </div>
      </div>
    </div>
  );
}
