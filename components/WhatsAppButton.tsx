'use client';

import { motion, AnimatePresence } from '@/components/motion';
import { useState } from 'react';

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);

  const phoneNumber = '441234567890';
  const defaultMessage = 'Hi Digital-Footprint.uk, I have a question about your services.';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="mb-2 rounded-2xl p-4 shadow-2xl max-w-xs bg-white border border-gray-100"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                <i className="ri-whatsapp-line text-white text-xl"></i>
              </div>
              <div>
                <h4 className="font-mono font-bold text-sm mb-1 text-gray-900">
                  Chat on WhatsApp
                </h4>
                <p className="text-xs leading-relaxed text-gray-500">
                  Typical response time: under 10 minutes during business hours.
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs mb-2 text-gray-400">Quick options:</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Get a quote', msg: 'Hi, I would like to get a quote for a project.' },
                  { label: 'Ask a question', msg: 'Hi, I have a question about your services.' },
                  { label: 'Book a call', msg: 'Hi, I would like to book a discovery call.' }
                ].map((option) => (
                  <a
                    key={option.label}
                    href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(option.msg)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono px-3 py-2 rounded-lg bg-gray-50 hover:bg-[#25D366]/10 text-gray-600 hover:text-[#128C7E] transition-all cursor-pointer"
                    onClick={() => setIsOpen(false)}
                  >
                    {option.label}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-all duration-300 ${
          isOpen 
            ? 'bg-gray-700 hover:bg-gray-600' 
            : 'bg-[#25D366] hover:bg-[#128C7E]'
        }`}
        aria-label={isOpen ? 'Close WhatsApp chat' : 'Open WhatsApp chat'}
      >
        {isOpen ? (
          <i className="ri-close-line text-white text-2xl"></i>
        ) : (
          <i className="ri-whatsapp-line text-white text-2xl"></i>
        )}
      </motion.button>
    </div>
  );
}