import { z } from "zod";
import type { ProposalData } from "@/db/schema";

const phase = z.object({
  key: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  bullets: z.array(z.string().max(1000)).max(20),
  fee: z.number().min(0).max(10_000_000),
  duration: z.string().max(60),
});

const activity = z.object({
  code: z.string().max(20),
  activity: z.string().min(1).max(300),
  authority: z.string().max(200),
  license: z.string().max(120),
  remarks: z.string().max(400),
  highlight: z.boolean(),
});

/** Validates proposal JSON coming from the builder before it is rendered or stored. */
export const proposalDataSchema: z.ZodType<ProposalData> = z.object({
  addresseeName: z.string().max(200),
  addresseeCompany: z.string().max(200),
  salutationLine: z.string().max(200),
  subject: z.string().min(1).max(300),
  intro: z.string().max(2000),
  phases: z.array(phase).min(1).max(12),
  includedEmployees: z.number().int().min(0).max(100),
  perEmployeeFee: z.number().min(0).max(1_000_000),
  routeNote: z.string().max(500),
  governmentFees: z.string().max(2000),
  thirdPartyCosts: z.string().max(2000),
  requiredDocuments: z.array(z.string().max(500)).max(20),
  keyPoints: z.array(z.string().max(800)).max(15),
  recurringCosts: z.string().max(2000),
  overallTimeline: z.string().max(60),
  timelineNote: z.string().max(1000),
  paymentTerms: z.string().max(500),
  phaseOneOnlyClause: z.boolean(),
  validityDays: z.number().int().min(1).max(365),
  signatoryName: z.string().min(1).max(120),
  signatoryTitle: z.string().max(120),
  includeActivityTable: z.boolean(),
  activityTableTitle: z.string().max(200),
  activityTableSubtitle: z.string().max(400),
  activities: z.array(activity).max(30),
  activitySummary: z.string().max(2000),
  activityNote: z.string().max(2000),
  dateG: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
