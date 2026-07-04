interface ServiceCardProps {
  title: string;
  description: string;
  icon: string;
}

export const ServiceCard = ({ title, description, icon }: ServiceCardProps) => {
  return (
    <div className="bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-lg p-6 hover:border-cyan-400 hover:shadow-cyan-lg transition-all duration-200 ease-out">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
};
