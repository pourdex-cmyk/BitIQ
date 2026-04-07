import { CreateProjectForm } from "@/components/projects/CreateProjectForm";

export default function NewProjectPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1
          className="text-3xl font-bold text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          New Project
        </h1>
        <p className="text-[var(--text-secondary)] mt-1 text-sm">
          Set up a property, generate a scope of work, and invite contractors to bid
        </p>
      </div>
      <CreateProjectForm />
    </div>
  );
}
