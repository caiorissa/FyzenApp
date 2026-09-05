import { motion } from "framer-motion";

export default function StreakPopup({ message, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
      className="
        fixed top-4 left-1/2 -translate-x-1/2
        bg-slate-900/80 backdrop-blur-xl
        text-slate-100 px-5 py-3 rounded-xl shadow-lg
        border border-white/10
        text-center max-w-[90%] z-[9999]
      "
    >
      {message}

      <button
        className="block mx-auto mt-2 text-xs text-teal-300"
        onClick={onClose}
      >
        Fechar
      </button>
    </motion.div>
  );
}
