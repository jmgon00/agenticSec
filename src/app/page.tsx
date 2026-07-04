import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Services } from "@/components/sections/Services";
import { Demos } from "@/components/sections/Demos";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Services />

      {/* CTA Section to Sub-Pages */}
      <section className="py-20 bg-gray-900 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Explora más
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/portfolio" className="group">
              <div className="p-8 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition-all text-center">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400">
                  Portfolio
                </h3>
                <p className="text-gray-300 mb-4">
                  Proyectos completados y resultados demostrables
                </p>
                <Button>Ver Proyectos →</Button>
              </div>
            </Link>

            <Link href="/presupuesto" className="group">
              <div className="p-8 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition-all text-center">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400">
                  Presupuesto
                </h3>
                <p className="text-gray-300 mb-4">
                  Solicita un presupuesto personalizado para tu proyecto
                </p>
                <Button>Solicitar Presupuesto →</Button>
              </div>
            </Link>

            <Link href="/agentic-ia" className="group">
              <div className="p-8 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition-all text-center">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400">
                  Agentic IA
                </h3>
                <p className="text-gray-300 mb-4">
                  El diferenciador: Automatización inteligente
                </p>
                <Button>Descubre Cómo →</Button>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <Demos />
      <Contact />
      <Footer />
    </main>
  );
}
