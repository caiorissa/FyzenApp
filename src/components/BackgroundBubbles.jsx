import { motion } from "framer-motion";

export default function BackgroundBubbles() {
  const bubbles = Array.from({ length: 50 });

  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      {bubbles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white/10"
          style={{
            width: `${Math.random() * 90 + 30}px`,
            height: `${Math.random() * 90 + 30}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: Math.random() * 5 + 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}
