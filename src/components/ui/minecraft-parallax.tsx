import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export const MinecraftParallax = () => {
  const { scrollY } = useScroll();
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    setWindowHeight(window.innerHeight);
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Smooth parallax transforms with spring physics
  const smoothScrollY = useSpring(scrollY, { 
    stiffness: 100, 
    damping: 30, 
    restSpeed: 10 
  });

  const yBlock1 = useTransform(smoothScrollY, [0, windowHeight * 2], [0, -300]);
  const yBlock2 = useTransform(smoothScrollY, [0, windowHeight * 2], [0, -200]);
  const yBlock3 = useTransform(smoothScrollY, [0, windowHeight * 2], [0, -400]);
  const yBlock4 = useTransform(smoothScrollY, [0, windowHeight * 2], [0, -150]);
  const yBlock5 = useTransform(smoothScrollY, [0, windowHeight * 2], [0, -350]);

  // Smooth scroll-based rotation
  const rotateBlock1 = useTransform(smoothScrollY, [0, windowHeight * 2], [0, 180]);
  const rotateBlock2 = useTransform(smoothScrollY, [0, windowHeight * 2], [0, -90]);
  const rotateBlock3 = useTransform(smoothScrollY, [0, windowHeight * 2], [0, 270]);

  // Smooth scroll-based opacity
  const opacity = useTransform(smoothScrollY, [0, windowHeight, windowHeight * 1.5], [0.6, 0.8, 0.4]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Minecraft blocks - only scroll-based movement */}
      <motion.div
        style={{ y: yBlock1, rotate: rotateBlock1, opacity }}
        className="absolute top-20 left-12 w-12 h-12 bg-gradient-to-br from-pink-300/40 to-pink-500/40 backdrop-blur-sm border border-pink-400/20 shadow-lg rounded-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 2, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
      
      <motion.div
        style={{ y: yBlock2, rotate: rotateBlock2, opacity }}
        className="absolute top-40 right-16 w-10 h-10 bg-gradient-to-br from-rose-300/40 to-rose-500/40 backdrop-blur-sm border border-rose-400/20 shadow-lg rounded-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 2.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
      />
      
      <motion.div
        style={{ y: yBlock3, rotate: rotateBlock3, opacity }}
        className="absolute top-64 left-1/4 w-14 h-14 bg-gradient-to-br from-purple-300/40 to-purple-500/40 backdrop-blur-sm border border-purple-400/20 shadow-lg rounded-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ duration: 2.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.6 }}
      />
      
      <motion.div
        style={{ y: yBlock4, opacity }}
        className="absolute bottom-32 right-20 w-11 h-11 bg-gradient-to-br from-pink-400/40 to-pink-600/40 backdrop-blur-sm border border-pink-500/20 shadow-lg rounded-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 2.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.9 }}
      />
      
      <motion.div
        style={{ y: yBlock5, rotate: rotateBlock1, opacity }}
        className="absolute bottom-16 left-1/3 w-9 h-9 bg-gradient-to-br from-rose-400/40 to-rose-600/40 backdrop-blur-sm border border-rose-500/20 shadow-lg rounded-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 3, ease: [0.25, 0.46, 0.45, 0.94], delay: 1.2 }}
      />

      <motion.div
        style={{ y: yBlock2, opacity }}
        className="absolute top-80 right-1/3 w-8 h-8 bg-gradient-to-br from-purple-400/40 to-purple-600/40 backdrop-blur-sm border border-purple-500/20 shadow-lg rounded-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 2.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.5 }}
      />

      {/* Smooth glowing particles */}
      <motion.div
        className="absolute top-48 left-1/2 w-2 h-2 bg-primary rounded-full"
        animate={{ 
          opacity: [0.3, 0.7, 0.3],
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
      />
      
      <motion.div
        className="absolute bottom-40 right-1/3 w-3 h-3 bg-secondary rounded-full"
        animate={{ 
          opacity: [0.2, 0.6, 0.2],
          scale: [1, 1.4, 1]
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity, 
          ease: [0.25, 0.46, 0.45, 0.94],
          delay: 1.5
        }}
      />
    </div>
  );
};