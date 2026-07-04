interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({
  label,
  error,
  className = "",
  ...props
}: InputProps) => {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {props.required && <span className="text-magenta-400"> *</span>}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-2 bg-gray-900/30 border rounded-lg
          text-white placeholder-gray-500 transition-all duration-200
          focus:outline-none focus:border-cyan-400 focus:shadow-cyan-lg focus:shadow-glow-cyan
          ${error ? "border-magenta-400" : "border-gray-800"}
          backdrop-blur-sm
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-magenta-400 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};
