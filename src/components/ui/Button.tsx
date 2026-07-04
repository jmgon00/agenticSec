import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) => {
  const baseStyles = `
    font-semibold rounded-lg transition-all duration-300 ease-out
    flex items-center justify-center gap-2
    hover:scale-105 active:scale-95
  `;

  const variantStyles = {
    primary: `
      bg-cyan-400 text-dark-base hover:shadow-glow-cyan hover:shadow-cyan-lg
      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
    `,
    secondary: `
      bg-magenta-400 text-white hover:shadow-glow-magenta
      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
    `,
    outline: `
      border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-dark-base
      transition-colors disabled:opacity-50 disabled:cursor-not-allowed
    `,
  };

  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
