"use client";

import { useState } from "react";
import { contactFormSchema } from "@/lib/validators";
import { SERVICES } from "@/content/config";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface FormErrors {
  [key: string]: string;
}

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    serviceType: "",
    message: "",
    budgetRange: "",
    honeypot: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const result = contactFormSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const fieldName = err.path.join(".");
        newErrors[fieldName] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.error || "Error al enviar la solicitud");
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        company: "",
        serviceType: "",
        message: "",
        budgetRange: "",
        honeypot: "",
      });

      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      setServerError("Error de conexión. Intenta de nuevo.");
      console.error("Form submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-gray-900 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">
          Solicitar Presupuesto
        </h2>

        {submitted && (
          <div className="mb-6 p-4 bg-green-900 border border-green-700 rounded-lg text-green-300">
            ✓ Gracias por tu solicitud. Nos pondremos en contacto pronto.
          </div>
        )}

        {serverError && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg text-red-300">
            ✗ {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nombre"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Tu nombre"
            required
            error={errors.name}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="tu@email.com"
            required
            error={errors.email}
          />

          <Input
            label="Empresa (opcional)"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Nombre de tu empresa"
            error={errors.company}
          />

          <Select
            label="Tipo de Servicio"
            name="serviceType"
            value={formData.serviceType}
            onChange={handleChange}
            options={SERVICES.map((s) => ({
              value: s.id,
              label: s.title,
            }))}
            required
            error={errors.serviceType}
          />

          <Select
            label="Rango de Presupuesto (opcional)"
            name="budgetRange"
            value={formData.budgetRange}
            onChange={handleChange}
            options={[
              { value: "5k-10k", label: "$5,000 - $10,000" },
              { value: "10k-25k", label: "$10,000 - $25,000" },
              { value: "25k+", label: "$25,000+" },
              { value: "otro", label: "Otro" },
            ]}
            error={errors.budgetRange}
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descripción del Proyecto <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Cuéntanos sobre tu proyecto..."
              required
              rows={5}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            {errors.message && (
              <p className="text-red-500 text-sm mt-1">{errors.message}</p>
            )}
          </div>

          {/* Honeypot anti-spam (hidden) */}
          <input
            type="text"
            name="honeypot"
            value={formData.honeypot}
            onChange={handleChange}
            style={{ display: "none" }}
            autoComplete="off"
            tabIndex={-1}
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? "Enviando..." : "Enviar Solicitud"}
          </Button>
        </form>
      </div>
    </section>
  );
};
