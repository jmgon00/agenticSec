interface DemoCardProps {
  title: string;
  description: string;
  embedUrl: string;
}

export const DemoCard = ({ title, description, embedUrl }: DemoCardProps) => {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 transition-all duration-200">
      <div className="bg-gray-700 h-64 flex items-center justify-center">
        <iframe
          src={embedUrl}
          title={title}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </div>
  );
};
