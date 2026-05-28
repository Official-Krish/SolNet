import { motion } from "motion/react";

function LegalPage({
  title,
  tag,
  date,
  sections,
}: {
  title: string;
  tag: string;
  date: string;
  sections: { heading: string; body: string }[];
}) {
  return (
    <div className="min-h-screen bg-[#F4F2F8] dark:bg-zinc-950 pt-28 pb-40 px-6 overflow-hidden">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 40% 20% at 70% 5%, rgba(153,69,255,0.04), transparent 70%)",
        }}
      />

      <div className="max-w-3xl mx-auto">
        {/* header */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mb-8"
          >
            <span className="h-px w-6 bg-zinc-300 dark:bg-zinc-700" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-zinc-500 dark:text-white/40">
              {tag}
            </span>
            <span className="ml-auto text-[11px] font-mono text-zinc-400 dark:text-zinc-600">
              {date}
            </span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-zinc-950 dark:text-white">
            <span className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {title}
              </motion.span>
            </span>
          </h1>
        </div>

        {/* content */}
        <div className="space-y-0 divide-y divide-black/[0.04] dark:divide-white/[0.04]">
          {sections.map((s, i) => (
            <motion.div
              key={s.heading}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.5 }}
              className="py-8"
            >
              <h2 className="text-xs tracking-[0.18em] uppercase text-zinc-400 dark:text-zinc-600 mb-3">
                {s.heading}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 font-light leading-relaxed max-w-2xl">
                {s.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      tag="Legal"
      date="May 2026"
      sections={[
        {
          heading: "Information we collect",
          body: "Wallet addresses for authentication, email addresses for notifications, and usage telemetry to improve service reliability. Private keys are never requested or stored.",
        },
        {
          heading: "How we use your data",
          body: "To provision VMs, process SOL escrow transactions, manage DePIN node registrations, and send operational notifications.",
        },
        {
          heading: "Data storage",
          body: "Off-chain data is stored in encrypted databases. Wallet addresses and transactions are public on the Solana blockchain by nature.",
        },
        {
          heading: "Third-party services",
          body: "We integrate with Solana RPC providers, AWS, and GCP for infrastructure delivery. Each provider operates under their own data policies.",
        },
        {
          heading: "Your rights",
          body: "Request deletion of off-chain account data at any time via Krishanand974@gmail.com. On-chain data is immutable by design.",
        },
        {
          heading: "Contact",
          body: "Privacy inquiries: Krishanand974@gmail.com",
        },
      ]}
    />
  );
}

export function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      tag="Legal"
      date="May 2026"
      sections={[
        {
          heading: "Acceptance",
          body: "By using Axion you agree to these terms. If you disagree, do not use the service.",
        },
        {
          heading: "Service description",
          body: "Axion provides decentralized VM rental and DePIN hosting infrastructure paid via SOL on the Solana blockchain.",
        },
        {
          heading: "User responsibilities",
          body: "You are responsible for wallet security, legal compliance in your jurisdiction, and not using the service for harmful or illegal purposes.",
        },
        {
          heading: "Payments",
          body: "All charges are in SOL via smart contract escrow. Transactions confirmed on-chain are final. Proportional refunds are issued for unused session time.",
        },
        {
          heading: "DePIN hosting",
          body: "Hosts must maintain declared uptime. Verified misbehavior results in on-chain penalties as defined in the Anchor program.",
        },
        {
          heading: "Liability limitation",
          body: "Axion is provided as-is. We are not liable for losses due to network outages, smart contract limitations, or third-party provider failures.",
        },
        {
          heading: "Modifications",
          body: "We may update these terms at any time. Continued use constitutes acceptance.",
        },
      ]}
    />
  );
}

export function Cookies() {
  return (
    <LegalPage
      title="Cookie Policy"
      tag="Legal"
      date="May 2026"
      sections={[
        {
          heading: "What are cookies",
          body: "Small text files or localStorage entries that help us maintain session state and remember your preferences.",
        },
        {
          heading: "Essential storage",
          body: "JWT authentication tokens are stored in localStorage. These are required for the platform to function and cannot be disabled while using the service.",
        },
        {
          heading: "Preference storage",
          body: "Theme preference (light/dark) and UI settings are persisted locally in your browser.",
        },
        {
          heading: "Analytics",
          body: "We use minimal, privacy-respecting analytics to understand aggregate usage patterns. No personally identifiable data is shared with third parties.",
        },
        {
          heading: "Managing cookies",
          body: "Clear browser storage to remove all session data. You will need to reconnect your wallet and sign in again.",
        },
      ]}
    />
  );
}

export function GDPR() {
  return (
    <LegalPage
      title="GDPR"
      tag="Legal · EU"
      date="May 2026"
      sections={[
        {
          heading: "Data controller",
          body: "Axion acts as the data controller for personal data processed through this platform.",
        },
        {
          heading: "Legal basis for processing",
          body: "Contract performance (delivering services), legitimate interest (platform improvement), and explicit consent where required (marketing).",
        },
        {
          heading: "Your rights",
          body: "Under GDPR you have the right to access, rectify, erase, restrict processing, data portability, and object to processing of your personal data.",
        },
        {
          heading: "Data retention",
          body: "Off-chain account data is deleted within 30 days of an erasure request. On-chain records are immutable and fall outside GDPR erasure scope.",
        },
        {
          heading: "International transfers",
          body: "Data may be processed by infrastructure providers operating in multiple regions. Transfers are governed by standard contractual clauses where applicable.",
        },
        {
          heading: "Contact",
          body: "Data protection inquiries: Krishanand974@gmail.com",
        },
      ]}
    />
  );
}
