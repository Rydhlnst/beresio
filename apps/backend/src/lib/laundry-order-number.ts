import { sql } from "drizzle-orm";

const PREFIX = "LDR";
const PAD = 3;

function toSequenceDate(date: Date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function toOrderDateToken(sequenceDate: string) {
    return sequenceDate.replaceAll("-", "");
}

export async function generateLaundryOrderNumber(
    db: any,
    input: {
        organizationId: string;
        branchId: string;
        now?: Date;
    }
) {
    const now = input.now ?? new Date();
    const sequenceDate = toSequenceDate(now);
    const result = await db.execute(sql`
        insert into laundry_order_sequences (organization_id, branch_id, sequence_date, last_number, updated_at)
        values (${input.organizationId}, ${input.branchId}::uuid, ${sequenceDate}::date, 1, now())
        on conflict (organization_id, branch_id, sequence_date)
        do update set last_number = laundry_order_sequences.last_number + 1, updated_at = now()
        returning last_number
    `);

    const rows = (result as any)?.rows ?? result;
    const lastNumber = Number(rows?.[0]?.last_number ?? rows?.[0]?.lastNumber);
    if (!Number.isFinite(lastNumber)) {
        throw new Error("FAILED_TO_GENERATE_LAUNDRY_ORDER_NUMBER");
    }

    const dateToken = toOrderDateToken(sequenceDate);
    const sequenceToken = String(lastNumber).padStart(PAD, "0");
    return `${PREFIX}-${dateToken}-${sequenceToken}`;
}

