"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface FormErrors {
  [key: string]: string;
}

export const BudgetForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    projectType: "",
    description: "",
    timeline: "",
    tentativeBudget: "",
    preferredContact: "email",
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

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = "Nombre requerido";
    if (!formData.email.trim()) newErrors.email = "Email requerido";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Email inválido";
    if (!formData.projectType) newErrors.projectType = "Tipo de proyecto requerido";
    if (!formData.description.trim()) newErrors.description = "Descripción requerida";
    if (!formData.timeline) newErrors.timeline = "Timeline requerido";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (formData.honeypot) {
      console.log("Honeypot triggered");
      setSubmitted(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          serviceType: formData.projectType,
          message: formData.description,
          budgetRange: formData.tentativeBudget || "no-specified",
          contactPreference: formData.preferredContact,
        }),
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
        projectType: "",
        description: "",
        timeline: "",
        tentativeBudget: "",
        preferredContact: "email",
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {submitted && (
        <div className="p-4 bg-green-900 border border-green-700 rounded-lg text-green-300">
          ✓ Solicitud recibida. Nos pondremos en contacto pronto.
        </div>
      )}

      {serverError && (
        <div className="p-4 bg-red-900 border border-red-700 rounded-lg text-red-300">
          ✗ {serverError}
        </div>
      )}

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
        label="Tipo de Proyecto"
        name="projectType"
        value={formData.projectType}
        onChange={handleChange}
        options={[
          { value: "", label: "Selecciona un tipo..." },
          { value: "analysis", label: "Análisis" },
          { value: "automation", label: "Automatización" },
          { value: "development", label: "Desarrollo" },
          { value: "consulting", label: "Consultoría" },
          { value: "other", label: "Otro" },
        ]}
        required
        error={errors.projectType}
      />

      <Select
        label="Timeline Deseado"
        name="timeline"
        value={formData.timeline}
        onChange={handleChange}
        options={[
          { value: "", label: "Selecciona un timeline..." },
          { value: "asap", label: "ASAP" },
          { value: "1-3", label: "1-3 meses" },
          { value: "3-6", label: "3-6 meses" },
          { value: "flexible", label: "Flexible" },
        ]}
        required
        error={errors.timeline}
      />

      <Input
        label="Presupuesto Tentativo (opcional)"
        name="tentativeBudget"
        value={formData.tentativeBudget}
        onChange={handleChange}
        placeholder="Ej: $5,000 - $10,000"
        error={errors.tentativeBudget}
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Preferencia de Contacto
        </label>
        <div className="space-y-2">
          {[
            { value: "email", label: "Email" },
            { value: "whatsapp", label: "WhatsApp" },
            { value: "phone", label: "Teléfono" },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="preferredContact"
                value={option.value}
                checked={formData.preferredContact === option.value}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="text-gray-300">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Textarea
        label="Descripción del Proyecto"
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Cuéntanos sobre tu proyecto, necesidades y objetivos..."
        required
        rows={5}
        error={errors.description}
      />

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
        {loading ? "Enviando..." : "Solicitar Presupuesto"}
      </Button>
    </form>
  );
};
