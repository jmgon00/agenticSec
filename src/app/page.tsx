import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Services } from "@/components/sections/Services";
import { Demos } from "@/components/sections/Demos";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Services />
      <Demos />
      <Contact />
      <Footer />
    </main>
  );
}
