import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = ({ children, className = "", ...props }: CardProps) => {
  return (
    <div
      className={`
        bg-gray-900/50 backdrop-blur-lg border border-gray-800
        rounded-lg p-6 transition-all duration-300 ease-out
        hover:border-cyan-400 hover:-translate-y-1 hover:shadow-cyan-lg
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
