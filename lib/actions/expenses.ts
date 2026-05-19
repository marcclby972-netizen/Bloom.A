'use server'

import * as svc from '@/lib/services/expenses'
import { withResult } from './_result'
import type { CreateExpenseInput } from '@/lib/services/expenses'

export async function getExpensesAction(opts: {
  teamId: string
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
  from?: string
  to?: string
}) {
  return withResult(svc.getExpenses(opts))
}

export async function createExpenseAction(input: CreateExpenseInput) {
  return withResult(svc.createExpense(input))
}

export async function syncExpenseStatusAction(id: string) {
  return withResult(svc.syncExpenseStatusFromDecision(id))
}

export async function cancelExpenseAction(id: string) {
  return withResult(svc.cancelExpense(id))
}

export async function deleteExpenseAction(id: string) {
  return withResult(svc.deleteExpense(id))
}

export async function getMonthlyExpensesTotalAction(teamId: string) {
  return withResult(svc.getMonthlyTotal(teamId))
}
