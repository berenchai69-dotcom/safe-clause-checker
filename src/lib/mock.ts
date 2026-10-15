import type { Analysis, Comparison } from "./types";

export const SAMPLE_CONTRACT = `RESIDENTIAL LEASE AGREEMENT

1. TERM. This lease begins on 1 November 2026 and runs for twelve (12) months.
2. RENT. Tenant shall pay $1,450 per month, due on the 1st. A late fee of 15% applies after 2 days.
3. RENT INCREASE. Landlord may increase rent at any time with 7 days written notice.
4. SECURITY DEPOSIT. Tenant pays a deposit equal to three (3) months' rent, non-refundable for cleaning.
5. MAINTENANCE. Tenant is responsible for ALL repairs, including the roof, plumbing, and central AC.
6. ENTRY. Landlord may enter the premises at any time without notice.
7. UTILITIES. Tenant pays electricity and internet; landlord pays water.
8. PETS. One small pet allowed with written consent.
9. TERMINATION. Tenant must give 60 days notice. Early termination forfeits the full deposit plus 3 months' rent.
10. GOVERNING LAW. This lease is governed by local residential tenancy law.`;

export const SAMPLE_CONTRACT_NEW = SAMPLE_CONTRACT.replace("$1,450", "$1,450 plus a $120 monthly 'building service fee'")
  .replace("Landlord pays water.", "Tenant pays all utilities including water and building generator.")
  .replace("60 days", "90 days");

export function mockAnalysis(): Analysis {
  return {
    offline: true,
    title: "Residential Lease (offline demo analysis)",
    summary:
      "This lease contains several clauses that heavily favor the landlord. 4 clauses look fair, 2 need clarification and 4 are risky. Negotiate the rent-increase, deposit, maintenance and entry terms before signing.",
    advice: [
      "Ask for rent to be fixed for the full 12-month term.",
      "Request a refundable deposit capped at 1 month's rent.",
      "Limit tenant maintenance to minor, tenant-caused damage.",
      "Require 24 hours' notice before landlord entry.",
    ],
    clauses: [
      { title: "Lease term", text: "12 months from 1 Nov 2026", level: "green", explanation: "A standard fixed term.", questions: [] },
      { title: "Rent & late fee", text: "15% late fee after 2 days", level: "yellow", explanation: "The grace period is short and the fee is high.", questions: ["Can the grace period be 5 days?", "Can the late fee be a fixed small amount?"] },
      { title: "Rent increase", text: "Increase at any time with 7 days notice", level: "red", explanation: "Allows surprise hikes mid-lease.", questions: ["Will you fix rent for the full term?", "What is the maximum yearly increase?"] },
      { title: "Security deposit", text: "3 months, non-refundable", level: "red", explanation: "Deposits are usually refundable and smaller.", questions: ["Can the deposit be 1 month and refundable?", "What deductions are allowed?"] },
      { title: "Maintenance", text: "Tenant responsible for ALL repairs", level: "red", explanation: "Structural & major systems are normally the landlord's duty.", questions: ["Who pays for roof, plumbing and AC failures?", "Can we list tenant duties explicitly?"] },
      { title: "Landlord entry", text: "Entry at any time without notice", level: "red", explanation: "Undermines your privacy.", questions: ["Will you agree to 24h notice except emergencies?"] },
      { title: "Utilities", text: "Tenant: electricity & internet", level: "green", explanation: "Common split.", questions: [] },
      { title: "Pets", text: "One small pet with consent", level: "green", explanation: "Reasonable.", questions: [] },
      { title: "Early termination", text: "Forfeit deposit + 3 months", level: "yellow", explanation: "A steep penalty.", questions: ["Can I find a replacement tenant instead?", "Can the penalty be one month?"] },
      { title: "Governing law", text: "Local tenancy law", level: "green", explanation: "Standard.", questions: [] },
    ],
  };
}

export function mockComparison(): Comparison {
  return {
    offline: true,
    summary: "The new version quietly increases your monthly cost and shifts utilities onto you.",
    changes: [
      { topic: "Rent", before: "$1,450/month", after: "$1,450 + $120 service fee", level: "red", impact: "Hidden ~8% rent hike." },
      { topic: "Utilities", before: "Landlord pays water", after: "Tenant pays all utilities incl. generator", level: "red", impact: "New recurring cost." },
      { topic: "Notice period", before: "60 days", after: "90 days", level: "yellow", impact: "Less flexibility to move." },
    ],
  };
}

export const MOCK_CHECKLIST = {
  groups: [
    { name: "Air conditioning", items: ["Unit cools within 10 minutes", "No leaks or unusual noise", "Filters clean", "Remote works"] },
    { name: "Plumbing", items: ["Water pressure in all taps", "No leaks under sinks", "Toilet flushes & refills", "Hot water heater works"] },
    { name: "Electrical & meters", items: ["Photograph electricity meter reading", "Photograph water meter reading", "All sockets work", "Breaker box labeled"] },
    { name: "Walls, floors & ceilings", items: ["No cracks or damp patches", "Paint condition noted", "Floor scratches photographed"] },
    { name: "Doors, windows & locks", items: ["All keys received", "Locks work", "Windows open & close", "Screens intact"] },
  ],
};
