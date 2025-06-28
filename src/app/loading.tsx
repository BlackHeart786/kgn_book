import React from 'react';
import { ImSpinner2 } from 'react-icons/im';

const Loading = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm space-y-6">
      {/* Spinner */}
      <ImSpinner2 className="text-emerald-400 text-6xl animate-spin" />

      {/* Text */}
      <p className="text-white text-lg font-medium tracking-wide">
        Fetching data, please wait...
      </p>
    </div>
  );
};

export default Loading;
