import { getMachineOperations } from "../_actions/bi-calculations";
import { MachineModelingClient } from "./_components/machine-modeling-client";
import { type BiMachineOperation } from "@beresio/db";

export default async function MachineModelingPage() {
    const res = await getMachineOperations();
    const data: BiMachineOperation = res.ok ? res.data : {} as BiMachineOperation;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-medium">Machine & Operations Settings</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Feed the system with your hardware realities to get hyper-accurate insights.
                </p>
            </div>
            <MachineModelingClient initialData={data} />
        </div>
    );
}
