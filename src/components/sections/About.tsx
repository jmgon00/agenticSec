import { ABOUT } from "@/content/config";

export const About = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-dark-base to-gray-900 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-white mb-8 text-center">
          {ABOUT.title}
        </h2>
        <div className="text-gray-300 text-lg leading-relaxed whitespace-pre-line">
          {ABOUT.description}
        </div>
      </div>
    </section>
  );
};
