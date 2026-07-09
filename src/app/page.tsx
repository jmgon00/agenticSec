import { Hero } from "@/components/sections/Hero";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <Hero />
      </div>
      <Footer />
    </div>
  );
}
