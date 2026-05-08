import {
    index,
    integer,
    jsonb,
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth.schema";
import { branches } from "./core.schema";
import { laundryOrders, laundryServices } from "./laundry.schema";

export const customerOrderIntakeChannelEnum = pgEnum("customer_order_intake_channel", [
    "whatsapp_link",
    "web_direct",
]);

export const customerOrderIntakeStatusEnum = pgEnum("customer_order_intake_status", [
    "draft_submission",
    "pending_verification",
    "accepted",
    "rejected",
    "cancelled",
    "expired",
    "converted",
]);

export const customerOrderIntakeRiskLevelEnum = pgEnum("customer_order_intake_risk_level", [
    "low",
    "medium",
    "high",
]);

export const customerOrderIntakeActorTypeEnum = pgEnum("customer_order_intake_actor_type", [
    "customer",
    "tenant",
    "system",
]);

export const publicOrderFunnelEventTypeEnum = pgEnum("public_order_funnel_event_type", [
    "session_started",
    "session_abandoned",
    "session_submitted",
]);

export const customerOrderIntakes = pgTable("customer_order_intakes", {
    id: uuid("id").primaryKey().defaultRandom(),
    referenceCode: varchar("reference_code", { length: 40 }).notNull(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    tenantSlug: varchar("tenant_slug", { length: 120 }).notNull(),
    branchSlug: varchar("branch_slug", { length: 120 }).notNull(),
    channel: customerOrderIntakeChannelEnum("channel").notNull().default("web_direct"),
    status: customerOrderIntakeStatusEnum("status").notNull().default("pending_verification"),
    orderType: text("order_type").notNull().default("pickup"), // pickup | drop_off
    customerName: varchar("customer_name", { length: 150 }).notNull(),
    customerPhoneRaw: varchar("customer_phone_raw", { length: 30 }).notNull(),
    customerPhoneNormalized: varchar("customer_phone_normalized", { length: 20 }).notNull(),
    customerAddress: text("customer_address").notNull(),
    pickupPreferenceAt: timestamp("pickup_preference_at"),
    paymentPreference: text("payment_preference"),
    notes: text("notes"),
    customFields: jsonb("custom_fields").$type<Record<string, unknown>>().notNull().default({}),
    consentAcceptedAt: timestamp("consent_accepted_at").notNull(),
    riskScore: integer("risk_score").notNull().default(0),
    riskLevel: customerOrderIntakeRiskLevelEnum("risk_level").notNull().default("low"),
    riskFlags: jsonb("risk_flags").$type<string[]>().notNull().default([]),
    idempotencyKey: varchar("idempotency_key", { length: 120 }).notNull(),
    requestHash: varchar("request_hash", { length: 128 }).notNull(),
    submitIpHash: varchar("submit_ip_hash", { length: 128 }),
    submitUserAgentHash: varchar("submit_user_agent_hash", { length: 128 }),
    convertedOrderId: uuid("converted_order_id")
        .references(() => laundryOrders.id, { onDelete: "set null" }),
    verifiedAt: timestamp("verified_at"),
    verifiedBy: text("verified_by")
        .references(() => user.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxCustomerOrderIntakesOrgStatusCreated: index("idx_customer_order_intakes_org_status_created")
            .on(table.organizationId, table.status, table.createdAt),
        idxCustomerOrderIntakesOrgBranchCreated: index("idx_customer_order_intakes_org_branch_created")
            .on(table.organizationId, table.branchId, table.createdAt),
        idxCustomerOrderIntakesOrgPhoneCreated: index("idx_customer_order_intakes_org_phone_created")
            .on(table.organizationId, table.customerPhoneNormalized, table.createdAt),
        idxCustomerOrderIntakesOrgRequestHashCreated: index("idx_customer_order_intakes_org_hash_created")
            .on(table.organizationId, table.requestHash, table.createdAt),
        uqCustomerOrderIntakesOrgReference: uniqueIndex("uq_customer_order_intakes_org_reference")
            .on(table.organizationId, table.referenceCode),
    };
});

export const customerOrderIntakeItems = pgTable("customer_order_intake_items", {
    id: uuid("id").primaryKey().defaultRandom(),
    intakeId: uuid("intake_id")
        .notNull()
        .references(() => customerOrderIntakes.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
        .references(() => laundryServices.id, { onDelete: "set null" }),
    serviceNameSnapshot: varchar("service_name_snapshot", { length: 150 }).notNull(),
    qty: numeric("qty", { precision: 10, scale: 2 }).notNull(),
    unit: varchar("unit", { length: 20 }).notNull().default("kg"),
    priceSnapshot: integer("price_snapshot").notNull().default(0),
    lineNote: text("line_note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxCustomerOrderIntakeItemsIntake: index("idx_customer_order_intake_items_intake").on(table.intakeId),
        idxCustomerOrderIntakeItemsService: index("idx_customer_order_intake_items_service").on(table.serviceId),
    };
});

export const customerOrderIntakeEvents = pgTable("customer_order_intake_events", {
    id: uuid("id").primaryKey().defaultRandom(),
    intakeId: uuid("intake_id")
        .notNull()
        .references(() => customerOrderIntakes.id, { onDelete: "cascade" }),
    fromStatus: customerOrderIntakeStatusEnum("from_status"),
    toStatus: customerOrderIntakeStatusEnum("to_status").notNull(),
    actorType: customerOrderIntakeActorTypeEnum("actor_type").notNull().default("system"),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxCustomerOrderIntakeEventsIntakeCreated: index("idx_customer_order_intake_events_intake_created")
            .on(table.intakeId, table.createdAt),
    };
});

export const publicSubmitIdempotency = pgTable("public_submit_idempotency", {
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    scope: varchar("scope", { length: 80 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 120 }).notNull(),
    requestHash: varchar("request_hash", { length: 128 }),
    responseStatus: integer("response_status").notNull(),
    responseBody: jsonb("response_body").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxPublicSubmitIdempotencyOrgCreated: index("idx_public_submit_idempotency_org_created")
            .on(table.organizationId, table.createdAt),
        uqPublicSubmitIdempotencyOrgScopeKey: uniqueIndex("uq_public_submit_idempotency_org_scope_key")
            .on(table.organizationId, table.scope, table.idempotencyKey),
    };
});

export const publicOrderFunnelEvents = pgTable("public_order_funnel_events", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    tenantSlug: varchar("tenant_slug", { length: 120 }).notNull(),
    branchSlug: varchar("branch_slug", { length: 120 }).notNull(),
    channel: customerOrderIntakeChannelEnum("channel").notNull().default("web_direct"),
    sessionId: varchar("session_id", { length: 120 }).notNull(),
    eventType: publicOrderFunnelEventTypeEnum("event_type").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxPublicOrderFunnelEventsOrgBranchCreated: index("idx_public_order_funnel_events_org_branch_created")
            .on(table.organizationId, table.branchId, table.createdAt),
        idxPublicOrderFunnelEventsOrgSession: index("idx_public_order_funnel_events_org_session")
            .on(table.organizationId, table.sessionId, table.createdAt),
        uqPublicOrderFunnelEventsSessionEvent: uniqueIndex("uq_public_order_funnel_events_session_event")
            .on(table.organizationId, table.sessionId, table.eventType),
    };
});
