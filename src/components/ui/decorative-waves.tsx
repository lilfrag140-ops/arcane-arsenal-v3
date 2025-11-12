import { motion } from 'framer-motion';

export const DecorativeWaves = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Top-left full-width wave */}
      <motion.div
        className="absolute -top-20 left-0 w-full"
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <motion.svg
          viewBox="0 0 1200 200"
          className="w-full h-48 text-pink-300/25"
          fill="currentColor"
          animate={{
            x: [0, 20, 0],
            y: [0, -8, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <path d="M0,50 C200,20 400,80 600,50 C800,20 1000,80 1200,50 L1200,0 L0,0 Z" />
          <path d="M0,100 C300,70 500,130 800,100 C900,80 1100,120 1200,100 L1200,50 C1000,80 800,20 600,50 C400,80 200,20 0,50 Z" opacity="0.7" />
          <path d="M0,150 C150,120 350,170 600,150 C850,130 1050,170 1200,150 L1200,100 C1100,120 900,80 800,100 C500,130 300,70 0,100 Z" opacity="0.4" />
        </motion.svg>
      </motion.div>

      {/* Bottom-left full-width wave */}
      <motion.div
        className="absolute -bottom-16 left-0 w-full"
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 2.5, ease: "easeOut", delay: 0.5 }}
      >
        <motion.svg
          viewBox="0 0 1200 150"
          className="w-full h-40 text-rose-300/20"
          fill="currentColor"
          animate={{
            x: [0, -15, 0],
            y: [0, 5, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <path d="M0,100 C200,120 400,80 600,100 C800,120 1000,80 1200,100 L1200,150 L0,150 Z" />
          <path d="M0,120 C300,140 500,100 800,120 C900,110 1100,130 1200,120 L1200,100 C1000,80 800,120 600,100 C400,80 200,120 0,100 Z" opacity="0.8" />
        </motion.svg>
      </motion.div>

      {/* Additional floating wave elements for mobile responsiveness */}
      <motion.div
        className="absolute top-1/3 right-4 md:right-10"
        animate={{
          rotate: [0, 8, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <svg
          viewBox="0 0 60 60"
          className="w-12 h-12 md:w-16 md:h-16 text-pink-400/20"
          fill="currentColor"
        >
          <circle cx="30" cy="30" r="25" />
        </svg>
      </motion.div>

      {/* Mobile-specific smaller wave */}
      <motion.div
        className="absolute top-2/3 left-4 block md:hidden"
        animate={{
          x: [0, 8, 0],
          y: [0, -5, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <svg
          viewBox="0 0 120 60"
          className="w-24 h-12 text-rose-300/25"
          fill="currentColor"
        >
          <path d="M0,30 C30,20 60,40 90,30 C105,25 120,35 120,30 L120,0 L0,0 Z" />
        </svg>
      </motion.div>

      {/* Right side floating element */}
      <motion.div
        className="absolute bottom-1/3 right-8 hidden lg:block"
        animate={{
          rotate: [0, -5, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <svg
          viewBox="0 0 80 80"
          className="w-20 h-20 text-purple-400/15"
          fill="currentColor"
        >
          <circle cx="40" cy="40" r="35" />
        </svg>
      </motion.div>
    </div>
  );
};