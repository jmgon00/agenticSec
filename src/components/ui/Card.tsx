import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = "" }: CardProps) => {
  return (
    <div
      className={`bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-all duration-200 ${className}`}
    >
      {children}
    </div>
  );
};
