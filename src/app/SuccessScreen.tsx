"use client";

import React, { useEffect } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { MdClose } from "react-icons/md";

interface SuccessScreenProps {
  title?: string;
  message: string;
  onClose?: () => void;
  duration?: number; 
  showCloseButton?: boolean;
  showActionButton?: boolean;
  actionText?: string;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({
  title = "Success!",
  message,
  onClose,
  duration,
  showCloseButton = true,
  showActionButton = true,
  actionText = "Continue",
}) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fade-in-strong"
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-gradient-to-br from-[#2D2E30] to-[#1C1C1D] rounded-xl shadow-2xl p-10 max-w-xl w-full text-center relative border border-green-600/50 animate-pop-in">
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition duration-300"
            aria-label="Close success message"
          >
            <MdClose size={28} />
          </button>
        )}

        <FaCheckCircle className="text-green-500 text-8xl mx-auto mb-8 animate-check-pulse" />
        <h2 className="text-4xl font-extrabold text-green-400 mb-5 tracking-wide">{title}</h2>
        <p className="text-xl text-gray-300 mb-10 leading-relaxed">{message}</p>

        {showActionButton && onClose && (
          <button
            onClick={onClose}
            className="bg-green-600 hover:bg-green-700 text-white py-3 px-8 rounded-full text-lg font-semibold transition duration-300 transform hover:scale-105 shadow-md"
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};

export default SuccessScreen;
