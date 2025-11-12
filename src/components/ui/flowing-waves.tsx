import { motion } from 'framer-motion';

export const FlowingWaves = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Top flowing wave */}
      <motion.div
        className="absolute -top-32 left-0 right-0"
        initial={{ x: -100 }}
        animate={{ x: 100 }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      >
        <svg
          viewBox="0 0 1200 300"
          className="w-full h-96 text-pink-300/30"
          fill="currentColor"
        >
          <path d="M0,100 C300,50 600,150 900,100 C1050,75 1150,125 1200,100 L1200,0 L0,0 Z" />
        </svg>
      </motion.div>
      
      {/* Second top wave */}
      <motion.div
        className="absolute -top-16 left-0 right-0"
        initial={{ x: 100 }}
        animate={{ x: -100 }}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      >
        <svg
          viewBox="0 0 1200 200"
          className="w-full h-64 text-rose-300/20"
          fill="currentColor"
        >
          <path d="M0,80 C400,40 800,120 1200,80 L1200,0 L0,0 Z" />
        </svg>
      </motion.div>

      {/* Bottom flowing wave */}
      <motion.div
        className="absolute -bottom-32 left-0 right-0"
        initial={{ x: 50 }}
        animate={{ x: -50 }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      >
        <svg
          viewBox="0 0 1200 300"
          className="w-full h-96 text-pink-300/25"
          fill="currentColor"
        >
          <path d="M0,200 C300,250 600,150 900,200 C1050,225 1150,175 1200,200 L1200,300 L0,300 Z" />
        </svg>
      </motion.div>
      
      {/* Second bottom wave */}
      <motion.div
        className="absolute -bottom-16 left-0 right-0"
        initial={{ x: -80 }}
        animate={{ x: 80 }}
        transition={{
          duration: 22,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      >
        <svg
          viewBox="0 0 1200 200"
          className="w-full h-64 text-rose-300/15"
          fill="currentColor"
        >
          <path d="M0,120 C400,160 800,80 1200,120 L1200,200 L0,200 Z" />
        </svg>
      </motion.div>
    </div>
  );
};