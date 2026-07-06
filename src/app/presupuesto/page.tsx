import { PageHeader } from "@/components/sections/PageHeader";
import { BudgetForm } from "@/components/sections/BudgetForm";

export default function PresupuestoPage() {
  return (
    <>
      <PageHeader
        title="Solicitar Presupuesto"
        subtitle="Cuéntanos sobre tu proyecto y recibirás un presupuesto personalizado"
      />
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <BudgetForm />
        </div>
      </section>
    </>
  );
}
