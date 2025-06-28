"use client";

import React, { useEffect, useState } from 'react';
import { MdOutlineSignalWifiOff, MdCloudOff, MdErrorOutline, MdRefresh } from 'react-icons/md';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string; statusCode?: number }; // Added statusCode for potential backend errors
  reset: () => void;
}

const ErrorPage: React.FC<ErrorProps> = ({ error, reset }) => {
  const [errorType, setErrorType] = useState<string>('unexpected'); // Default to unexpected

  useEffect(() => {
    console.error("Caught an application error:", error);

    // More robust error type detection
    if (navigator && !navigator.onLine) {
        setErrorType('offline'); // Check for explicit offline status
    } else if (error.message.includes('network') || error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION')) {
        setErrorType('network'); // General network issues
    } else if (error.statusCode === 401 || error.statusCode === 403) {
        setErrorType('auth'); // Authentication/Authorization issues
    } else if (error.statusCode >= 500) {
        setErrorType('server'); // Server-side errors
    } else {
        setErrorType('unexpected'); // Catch-all
    }
  }, [error]);

  const getErrorDetails = (type: string) => {
    switch (type) {
      case 'offline':
        return {
          icon: <MdOutlineSignalWifiOff className="text-blue-500 text-9xl mb-8" />,
          title: 'You Are Offline',
          message: 'It seems you\'re not connected to the internet. Please check your network and try again.',
          buttonText: 'Check Connection & Retry'
        };
      case 'network':
        return {
          icon: <MdCloudOff className="text-orange-500 text-9xl mb-8" />,
          title: 'Connection Lost',
          message: 'Failed to connect to our services. This might be a temporary network issue. Please try again.',
          buttonText: 'Reload Page'
        };
      case 'server':
        return {
          icon: <MdErrorOutline className="text-red-500 text-9xl mb-8" />,
          title: 'Server Is Having Issues',
          message: 'We\'re experiencing problems on our server. We\'re working hard to get things back to normal.',
          buttonText: 'Try Again Later'
        };
      case 'auth':
          return {
              icon: <MdErrorOutline className="text-yellow-500 text-9xl mb-8" />,
              title: 'Access Denied',
              message: 'You do not have permission to access this resource, or your session has expired. Please log in again.',
              buttonText: 'Go to Login'
          };
      case 'unexpected':
      default:
        return {
          icon: <MdErrorOutline className="text-red-500 text-9xl mb-8" />,
          title: 'Something Went Wrong',
          message: 'An unexpected error occurred. Our team has been notified. Please try refreshing the page.',
          buttonText: 'Refresh Page'
        };
    }
  };

  const { icon, title, message, buttonText } = getErrorDetails(errorType);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gradient-to-br from-[#1F2023] to-[#0A0A0B] text-white p-8 text-center">
      {icon}
      <h1 className="text-5xl font-extrabold mb-4 tracking-wide text-red-400">{title}</h1>
      <p className="text-xl text-gray-300 max-w-2xl mb-10 leading-relaxed">{message}</p>

      {/* Optionally display raw error message for debugging in dev mode */}
      {process.env.NODE_ENV === 'development' && error.message && (
          <p className="text-sm text-gray-500 mb-6 border border-gray-600 rounded-md p-3 max-w-md overflow-auto">
              Dev Info: {error.message}
          </p>
      )}

      <div className="flex space-x-6">
        {errorType === 'auth' ? (
             <Link href="/login" passHref> {/* Adjust to your login page route */}
                <button className="bg-yellow-600 hover:bg-yellow-700 text-white py-4 px-8 rounded-full flex items-center space-x-3 text-xl font-semibold transition duration-300 transform hover:scale-105 shadow-lg">
                    <span>{buttonText}</span>
                </button>
            </Link>
        ) : (
            <button
                className="bg-red-600 hover:bg-red-700 text-white py-4 px-8 rounded-full flex items-center space-x-3 text-xl font-semibold transition duration-300 transform hover:scale-105 shadow-lg"
                onClick={() => reset()}
            >
                <MdRefresh className="text-3xl" />
                <span>{buttonText}</span>
            </button>
        )}
        <Link href="/" passHref>
          <button className="bg-gray-700 hover:bg-gray-600 text-white py-4 px-8 rounded-full flex items-center space-x-3 text-xl font-semibold transition duration-300 transform hover:scale-105 shadow-lg">
            <span>Go to Home</span>
          </button>
        </Link>
      </div>
    </div>
  );
};

export default ErrorPage;