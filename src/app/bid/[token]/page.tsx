import { prisma } from "@/lib/prisma";
import { BidPortalForm } from "@/components/bids/BidPortalForm";
import type { BidInvitation, Property, PropertyPhoto, ScopeOfWork, SowLineItem, Project } from "@/types";

type InvitationWithProject = BidInvitation & {
  project: Project & {
    property: Property & { photos: PropertyPhoto[] };
    scopeOfWork: (ScopeOfWork & { lineItems: SowLineItem[] }) | null;
  };
};

async function getInvitation(token: string): Promise<InvitationWithProject | null> {
  return prisma.bidInvitation.findUnique({
    where: { token },
    include: {
      project: {
        include: {
          property: { include: { photos: true } },
          scopeOfWork: { include: { lineItems: { orderBy: { sortOrder: "asc" } } } },
        },
      },
    },
  }) as Promise<InvitationWithProject | null>;
}

export default async function BidPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await getInvitation(token);

  const now = new Date();

  if (!invitation) {
    return (
      <div className="min-h-screen bg-[var(--surface-base)] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(226,75,74,0.15)] flex items-center justify-center mx-auto">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1
            className="text-2xl font-bold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Invalid Invitation
          </h1>
          <p className="text-[var(--text-secondary)]">
            This bid invitation link is invalid or has already been used.
          </p>
        </div>
      </div>
    );
  }

  if (invitation.expiresAt && new Date(invitation.expiresAt) < now) {
    return (
      <div className="min-h-screen bg-[var(--surface-base)] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(226,75,74,0.15)] flex items-center justify-center mx-auto">
            <span className="text-3xl">⏰</span>
          </div>
          <h1
            className="text-2xl font-bold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Invitation Expired
          </h1>
          <p className="text-[var(--text-secondary)]">
            This bid invitation expired on{" "}
            {new Date(invitation.expiresAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            . Please contact Beantown Companies for a new invitation.
          </p>
        </div>
      </div>
    );
  }

  if (invitation.status === "BID_SUBMITTED") {
    return (
      <div className="min-h-screen bg-[var(--surface-base)] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(93,202,165,0.15)] flex items-center justify-center mx-auto">
            <span className="text-3xl">✅</span>
          </div>
          <h1
            className="text-2xl font-bold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Bid Already Submitted
          </h1>
          <p className="text-[var(--text-secondary)]">
            You have already submitted a bid for this project. We will be in touch.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BidPortalForm
      token={token}
      invitation={invitation}
      project={invitation.project}
      sowLineItems={invitation.project.scopeOfWork?.lineItems ?? []}
    />
  );
}
