import { prisma } from "@/lib/prisma";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import type { ProjectWithRelations, ProjectStatus } from "@/types";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Projects" },
  { value: "DRAFT", label: "Draft" },
  { value: "SOW_GENERATED", label: "SOW Ready" },
  { value: "BIDDING_OPEN", label: "Bidding Open" },
  { value: "BIDDING_CLOSED", label: "AI Scoring" },
  { value: "BID_SELECTED", label: "Bid Selected" },
  { value: "CONTRACTING", label: "Contracting" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETE", label: "Complete" },
];

async function getProjects(status?: string, search?: string) {
  return prisma.project.findMany({
    where: {
      ...(status ? { status: status as ProjectStatus } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { property: { address: { contains: search, mode: "insensitive" } } },
              { property: { city: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      property: { include: { photos: true } },
      owner: true,
      scopeOfWork: { include: { lineItems: true } },
      bids: {
        include: { lineItems: true, contractor: true, contractorProfile: true, invitation: true },
      },
      invitations: true,
      contract: true,
    },
    orderBy: { updatedAt: "desc" },
  }) as Promise<ProjectWithRelations[]>;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const { status, search } = await searchParams;
  const projects = await getProjects(status, search);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Projects
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
            {status ? ` · ${STATUS_OPTIONS.find((s) => s.value === status)?.label}` : ""}
          </p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--teal-600)] hover:bg-[var(--teal-500)] text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <form className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search projects..."
            className="pl-9 pr-4 py-2 bg-[var(--navy-800)] border border-[var(--surface-border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--teal-400)] w-64"
          />
        </form>

        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={opt.value ? `/projects?status=${opt.value}${search ? `&search=${search}` : ""}` : "/projects"}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                (status ?? "") === opt.value
                  ? "bg-[var(--teal-600)] text-white"
                  : "bg-[var(--navy-800)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--surface-border)]"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(93,202,165,0.1)] flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-[var(--teal-400)]" />
          </div>
          <h3
            className="text-xl font-bold text-[var(--text-primary)] mb-2"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            No projects yet
          </h3>
          <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-sm">
            Create your first project to start managing contractor bids with AI-powered analysis.
          </p>
          <Link
            href="/projects/new"
            className="flex items-center gap-2 px-6 py-3 bg-[var(--teal-600)] hover:bg-[var(--teal-500)] text-white rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
