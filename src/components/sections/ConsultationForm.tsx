"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ConsultationFormData } from "@/lib/validators";

interface ConsultationFormProps {
  defaultService?: ConsultationFormData["serviceInterest"];
  title?: string;
  submitText?: string;
}

interface FormErrors {
  [key: string]: string;
}

export const ConsultationForm = ({
  defaultService = "other",
  title,
  submitText = "Solicitar Consulta",
}: ConsultationFormProps) => {
  const [formData, setFormData] = useState<ConsultationFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    companySize: "startup",
    serviceInterest: defaultService,
    message: "",
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
      [name]: value as never,
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

    if (!formData.name.trim()) {
      newErrors.name = "Nombre requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Teléfono requerido";
    }

    if (!formData.company.trim()) {
      newErrors.company = "Nombre de empresa requerido";
    }

    if (!formData.companySize) {
      newErrors.companySize = "Tamaño de empresa requerido";
    }

    if (!formData.serviceInterest) {
      newErrors.serviceInterest = "Interés de servicio requerido";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Mensaje requerido";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "El mensaje debe tener al menos 10 caracteres";
    }

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

    setLoading(true);
    try {
      await axios.post("/api/consultation", formData);

      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        companySize: "startup",
        serviceInterest: defaultService,
        message: "",
      });

      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      setServerError("Error al enviar el formulario. Intenta de nuevo.");
      console.error("Form submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {title && <h2 className="text-2xl font-bold text-white">{title}</h2>}

      {submitted && (
        <div className="p-4 bg-green-900 border border-green-700 rounded-lg text-green-300">
          ¡Gracias por tu consulta! Pronto nos pondremos en contacto contigo para discutir tus
          necesidades.
        </div>
      )}

      {serverError && (
        <div className="p-4 bg-red-900 border border-red-700 rounded-lg text-red-300">
          {serverError}
        </div>
      )}

      <Input
        label="Nombre"
        name="name"
        type="text"
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
        label="Teléfono"
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={handleChange}
        placeholder="+34 123 456 789"
        required
        error={errors.phone}
      />

      <Input
        label="Empresa"
        name="company"
        type="text"
        value={formData.company}
        onChange={handleChange}
        placeholder="Nombre de tu empresa"
        required
        error={errors.company}
      />

      <Select
        label="Tamaño de Empresa"
        name="companySize"
        value={formData.companySize}
        onChange={handleChange}
        options={[
          { value: "startup", label: "Startup" },
          { value: "pyme", label: "PyME" },
          { value: "enterprise", label: "Enterprise" },
          { value: "other", label: "Otro" },
        ]}
        required
        error={errors.companySize}
      />

      <Select
        label="Interés de Servicio"
        name="serviceInterest"
        value={formData.serviceInterest}
        onChange={handleChange}
        options={[
          { value: "basic-audit", label: "Auditoría Básica de Seguridad" },
          { value: "web-analysis", label: "Análisis de Vulnerabilidades Web" },
          { value: "infrastructure", label: "Auditoría de Infraestructura" },
          { value: "compliance", label: "Auditoría de Compliance" },
          { value: "ia-inquiry", label: "Consulta sobre IA" },
          { value: "other", label: "Otro" },
        ]}
        required
        error={errors.serviceInterest}
      />

      <Textarea
        label="Mensaje"
        name="message"
        value={formData.message}
        onChange={handleChange}
        placeholder="Cuéntanos sobre tu consulta y necesidades..."
        required
        rows={5}
        error={errors.message}
      />

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Enviando..." : submitText}
      </Button>
    </form>
  );
};
