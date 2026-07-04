interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = ({ label, error, className = "", ...props }: TextareaProps) => {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {props.required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <textarea
        className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors ${
          error ? "border-red-500" : "border-gray-700"
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};
