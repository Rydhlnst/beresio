import { sql } from 'drizzle-orm'

const ORDER_PREFIX = 'ORD'
const ORDER_PAD = 4

export async function generateOrderNumber(db: any, organizationId: string) {
    const result = await db.execute(sql`
        insert into order_sequences (organization_id, last_number, updated_at)
        values (${organizationId}, 1, now())
        on conflict (organization_id)
        do update set last_number = order_sequences.last_number + 1, updated_at = now()
        returning last_number
    `)

    const rows = (result as any)?.rows ?? (result as any)
    const lastNumber = Number(rows?.[0]?.last_number ?? rows?.[0]?.lastNumber)

    if (!Number.isFinite(lastNumber)) {
        throw new Error('FAILED_TO_GENERATE_ORDER_NUMBER')
    }

    const padded = String(lastNumber).padStart(ORDER_PAD, '0')
    return `${ORDER_PREFIX}-${padded}`
}
