import type { AdapterAccountType } from "@auth/core/adapters"
import { pgTable, serial, integer, varchar, real, json, date, text, timestamp, primaryKey, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  username: varchar('username'),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
})

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ]
)
 
export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})
 
export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    {
      compositePk: primaryKey({
        columns: [verificationToken.identifier, verificationToken.token],
      }),
    },
  ]
)
 
export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => [
    {
      compositePK: primaryKey({
        columns: [authenticator.userId, authenticator.credentialID],
      }),
    },
  ]
)

export const course = pgTable('course', {
	id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
	title: varchar('title').notNull(),
	price: real().notNull(),
	shortDescription: varchar('shortDescription'),
	image: varchar("image")
	}
);

export const company = pgTable('company', {
	id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
	userId: text("user_id").references(() => users.id).notNull(),
	name: varchar('name').notNull(),
	vatId: varchar('vatId').notNull()
	}
);

export const invoice = pgTable('invoice', {
	id: serial('id').primaryKey().notNull(),
	invoiceFile: varchar('invoiceFile').notNull()
	}
);

export const order = pgTable('order', {
	id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
	userId: text("user_id").references(() => users.id).notNull(),
	companyId: text("company_id").references(() => company.id),
	courseId: text("course_id").references(() => course.id).notNull(),
	invoiceId: integer("invoice_id").references(() => invoice.id),
	paymentStatus: varchar('paymentStatus').notNull()
	}
);

export const content = pgTable('content', {
	id: serial('id').primaryKey().notNull(),
	courseId: text("course_id").references(() => course.id).notNull(),
	textContent: varchar("textContent"),
	videoPath: varchar("videoPath"),
	indexInCourse: integer("indexInCourse")
	}
);

export const review = pgTable('review', {
	id: serial('id').primaryKey().notNull(),
	userId: text("user_id").references(() => users.id).notNull(),
	courseId: text("courseId").references(() => course.id).notNull(),
	datePosted: date().notNull(),
	stars: integer("stars"),
	text: varchar("text")
	}
);