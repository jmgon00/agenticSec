import { SITE_CONFIG } from "@/content/config";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 border-t border-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Contact */}
          <div>
            <h3 className="text-white font-bold mb-4">Contacto</h3>
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              className="text-gray-400 hover:text-cyan-400 transition-colors"
            >
              {SITE_CONFIG.email}
            </a>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white font-bold mb-4">Sígueme</h3>
            <div className="flex gap-4">
              <a
                href={SITE_CONFIG.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-cyan-400 transition-colors"
              >
                LinkedIn
              </a>
              <a
                href={SITE_CONFIG.social.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-cyan-400 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-white font-bold mb-4">Información</h3>
            <p className="text-gray-400 text-sm">
              Servicios de ciberseguridad profesionales
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
          <p>
            © {currentYear} {SITE_CONFIG.author}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
