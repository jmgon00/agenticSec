interface SelectProps {
  label?: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  className?: string;
  error?: string;
}

export const Select = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  className = "",
  error,
}: SelectProps) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {required && <span className="text-magenta-400">*</span>}
        </label>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-4 py-2 bg-gray-900/30 border border-gray-800 rounded-lg text-white backdrop-blur-sm transition-all duration-200 focus:outline-none focus:border-cyan-400 focus:shadow-glow-cyan ${
          error ? "border-magenta-400" : ""
        } ${className}`}
      >
        <option value="">Selecciona una opción</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-magenta-400 text-sm mt-1">{error}</p>}
    </div>
  );
};
