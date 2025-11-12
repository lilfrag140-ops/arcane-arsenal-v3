import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const messages = [
  "You should really check this website out",
  "This is cheap as it ever gets!",
  "This is how I get all my elytras",
  "This is where I purchase from off stream"
];

export const NotificationLoop = () => {
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Initial delay before first notification
    const initialDelay = setTimeout(() => {
      showNextNotification();
    }, 3000);

    return () => clearTimeout(initialDelay);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Hide notification after 8-10 seconds
    const hideTimeout = setTimeout(() => {
      setIsVisible(false);
      
      // After hiding, wait 10 seconds then show next notification
      setTimeout(() => {
        showNextNotification();
      }, 10000);
    }, 8000);

    return () => clearTimeout(hideTimeout);
  }, [isVisible, currentMessage]);

  const showNextNotification = () => {
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setCurrentMessage(randomMessage);
    setIsVisible(true);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
      <AnimatePresence>
        {isVisible && currentMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-card/95 backdrop-blur-sm border border-primary/20 rounded-lg shadow-lg max-w-sm p-4"
          >
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">DrDonutt</p>
                <p className="text-muted-foreground text-sm mt-1">{currentMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};