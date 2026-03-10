import { relations } from "drizzle-orm/relations";
import { user, account, session, organization, member, branches, customers, invitation } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
	members: many(member),
	invitations: many(invitation),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const memberRelations = relations(member, ({one}) => ({
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [member.userId],
		references: [user.id]
	}),
}));

export const organizationRelations = relations(organization, ({many}) => ({
	members: many(member),
	branches: many(branches),
	customers: many(customers),
	invitations: many(invitation),
}));

export const branchesRelations = relations(branches, ({one}) => ({
	organization: one(organization, {
		fields: [branches.organizationId],
		references: [organization.id]
	}),
}));

export const customersRelations = relations(customers, ({one}) => ({
	organization: one(organization, {
		fields: [customers.organizationId],
		references: [organization.id]
	}),
}));

export const invitationRelations = relations(invitation, ({one}) => ({
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [invitation.inviterId],
		references: [user.id]
	}),
}));
