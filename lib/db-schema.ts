// This file contains the database schema types based on the SQL schema provided

export type Role = {
  id: number
  name: string
  description: string | null
  permissions: Record<string, any> | null
}

export type User = {
  id: number
  name: string
  email: string
  password: string
  roleId: number
  lastSession: Date | null
}

export type Client = {
  id: number
  companyName: string
  sector: string | null
  phone: string | null
  email: string | null
  address: string | null
  type: "B2B" | "B2C"
  ownerId: number
  createdAt: Date
  updatedAt: Date
  isPrivate: boolean
}

export type Contact = {
  id: number
  firstName: string
  lastName: string | null
  email: string | null
  phone: string | null
  position: string | null
  clientId: number
  isPrimaryContact: boolean
  createdAt: Date
  isPrivate: boolean
}

export type Campaign = {
  id: number
  name: string
  startDate: Date | null
  endDate: Date | null
  channel: string | null
  description: string | null
  budget: number | null
  expectedRoi: number | null
  status: "active" | "finished" | "paused"
}

export type Lead = {
  id: number
  name: string
  email: string | null
  phone: string | null
  source: string | null
  campaignId: number | null
  userId: number
  createdAt: Date
  isPrivate: boolean
}

export type Opportunity = {
  id: number
  name: string
  status: "new" | "qualified" | "proposal" | "closed-won" | "closed-lost"
  estimatedValue: number | null
  estimatedCloseDate: Date | null
  closeProbability: number | null
  source: string | null
  clientId: number | null
  leadId: number | null
  userId: number
  contactId: number | null
  isPrivate: boolean
}

export type Activity = {
  id: number
  type: "call" | "meeting" | "email" | "other"
  description: string | null
  date: Date
  duration: number | null
  result: "successful" | "failed" | "pending" | null
  userId: number
  clientId: number | null
  opportunityId: number | null
  contactId: number | null
  channelId: number | null
  isPrivate: boolean
}

export type Product = {
  id: number
  name: string
  description: string | null
  unitPrice: number
  category: string | null
}

export type OpportunityLine = {
  id: number
  opportunityId: number
  productId: number
  quantity: number
  discount: number | null
}

export type Quote = {
  id: number
  issueDate: Date
  expirationDate: Date | null
  status: "draft" | "sent" | "accepted" | "rejected"
  total: number
  clientId: number
  userId: number
  opportunityId: number | null
  isPrivate: boolean
}

export type QuoteLine = {
  id: number
  quoteId: number
  productId: number
  quantity: number
  unitPrice: number
  discount: number | null
}

export type Contract = {
  id: number
  startDate: Date
  endDate: Date | null
  status: "draft" | "active" | "finished"
  clientId: number
  userId: number
  conditions: string | null
  digitallySignedAt: boolean
  isPrivate: boolean
}

export type Task = {
  id: number
  title: string
  description: string | null
  status: "pending" | "in-progress" | "completed"
  priority: "high" | "medium" | "low"
  dueDate: Date | null
  userId: number
  opportunityId: number | null
  clientId: number | null
  createdAt: Date
  isPrivate: boolean
}

export type Invoice = {
  id: number
  invoiceNumber: string
  issueDate: Date
  dueDate: Date | null
  status: "paid" | "pending" | "overdue"
  total: number
  clientId: number
  quoteId: number | null
  contractId: number | null
  userId: number
  isPrivate: boolean
}

export type Note = {
  id: number
  content: string
  createdAt: Date
  userId: number
  clientId: number | null
  opportunityId: number | null
  leadId: number | null
  contactId: number | null
  isPrivate: boolean
}

export type Document = {
  id: number
  name: string
  type: string
  url: string
  uploadDate: Date
  clientId: number | null
  contractId: number | null
  quoteId: number | null
  opportunityId: number | null
  isPrivate: boolean
}

export type Tag = {
  id: number
  name: string
  category: string | null
}

export type ClientTag = {
  clientId: number
  tagId: number
}

export type LeadTag = {
  leadId: number
  tagId: number
}

export type OpportunityTag = {
  opportunityId: number
  tagId: number
}
