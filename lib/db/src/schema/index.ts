import { pgTable, text, timestamp, integer, doublePrecision, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Users Table
export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  role: text("role").notNull().default("Field Specialist"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

// Meters Table
export const metersTable = pgTable("meters", {
  id: text("id").primaryKey(),
  acNumber: text("ac_number").notNull(),
  serialNumber: text("serial_number").notNull(),
  customerName: text("customer_name").notNull(),
  customerMobile: text("customer_mobile").notNull(),
  address: text("address").notNull(),
  capacity: text("capacity").notNull(),
  company: text("company").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("AVAILABLE"),
  isTemporary: boolean("is_temporary").default(false),
  replacedByMeterId: text("replaced_by_meter_id"),
  replacedByMeterAc: text("replaced_by_meter_ac"),
  assignedTo: text("assigned_to"),
  assignedBy: text("assigned_by"),
  installationDate: text("installation_date"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  mapLink: text("map_link"),
  notes: text("notes"),
  pdco: text("pdco"),
  fileNumber: text("file_number"),
  cancellationReason: text("cancellation_reason"),
  history: jsonb("history").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMeterSchema = createInsertSchema(metersTable);
export type InsertMeter = z.infer<typeof insertMeterSchema>;
export type Meter = typeof metersTable.$inferSelect;

// Messages Table
export const messagesTable = pgTable("messages", {
  id: text("id").primaryKey(),
  senderName: text("sender_name").notNull(),
  receiverName: text("receiver_name").notNull(),
  text: text("text").notNull(),
  meterId: text("meter_id"),
  timestamp: text("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messagesTable);
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;

// Workspaces Table
export const workspacesTable = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default("North Punjab"),
  inventoryType: text("inventory_type").notNull().default("Meter inventory workspace"),
  region: text("region").notNull().default("Jalandhar, Punjab"),
  regionType: text("region_type").notNull().default("Default field region"),
  storageMode: text("storage_mode").notNull().default("Local-first storage"),
  storageDescription: text("storage_description").notNull().default("Changes are saved on this device"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWorkspaceSchema = createInsertSchema(workspacesTable);
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Workspace = typeof workspacesTable.$inferSelect;