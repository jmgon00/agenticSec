import { Hero } from "@/components/sections/Hero";
import { AgenticIAFeatures } from "@/components/sections/AgenticIAFeatures";

// Footer se renderiza una sola vez de forma global en src/app/layout.tsx.
// No importarlo/renderizarlo aquí también: eso era lo que duplicaba el
// footer al final de la home.
export default function Home() {
  return (
    <>
      <Hero />
      <AgenticIAFeatures />
    </>
  );
}
