"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@repo/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@repo/ui/sheet";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import {
    cancelInviteAction,
    createInviteAction,
    resendInviteAction,
    updateMemberRoleAction,
    updateMemberStatusAction,
} from "../actions";

type MemberRecord = {
    id: string;
    name: string;
    email: string;
    roleId?: string | null;
    role?: string | null;
    roleName?: string | null;
    status?: string | null;
    primaryBranch?: { id: string; name: string } | null;
    joinedAt?: string | Date | null;
};

type RoleRecord = {
    id: string;
    name: string;
    slug?: string | null;
    description?: string | null;
    isSystem?: boolean;
    permissionsCount?: number | null;
};

type InviteRecord = {
    id: string;
    email: string;
    status?: string | null;
    sentAt?: string | Date | null;
    role?: string | null;
    roleName?: string | null;
    branch?: { id: string; name: string } | null;
};

type BranchRecord = {
    id: string;
    name: string;
};

type TeamAccessPageClientProps = {
    members: MemberRecord[];
    roles: RoleRecord[];
    invites: InviteRecord[];
    branches: BranchRecord[];
};

function formatJoinedAt(value?: string | Date | null) {
    if (!value) return "-";
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return "-";
    return format(date, "MMM yyyy", { locale: id });
}

function formatInviteSent(value?: string | Date | null) {
    if (!value) return "-";
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return "-";
    return formatDistanceToNow(date, { addSuffix: true, locale: id });
}

function formatMemberStatus(status?: string | null) {
    if (status === "active") return "Aktif";
    if (status === "inactive") return "Nonaktif";
    if (!status) return "Unknown";
    return status;
}

function formatInviteStatus(status?: string | null) {
    if (status === "pending") return "Pending";
    if (status === "expired") return "Expired";
    if (status === "cancelled") return "Dibatalkan";
    if (status === "accepted") return "Diterima";
    if (!status) return "Unknown";
    return status;
}

export function TeamAccessPageClient({
    members,
    roles,
    invites,
    branches,
}: TeamAccessPageClientProps) {
    const normalizedBranches = Array.isArray(branches)
        ? branches
        : (branches as unknown as { data?: BranchRecord[] })?.data ?? [];
    const [isPending, startTransition] = useTransition();
    const [inviteOpen, setInviteOpen] = useState(false);
    const [memberQuery, setMemberQuery] = useState("");
    const [inviteQuery, setInviteQuery] = useState("");
    const [actionError, setActionError] = useState<string | null>(null);
    const [roleSheetOpen, setRoleSheetOpen] = useState(false);
    const [activeMember, setActiveMember] = useState<MemberRecord | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState("");
    const [membersState, setMembersState] = useState<MemberRecord[]>(members);
    const [invitesState, setInvitesState] = useState<InviteRecord[]>(invites);
    const [memberMutationId, setMemberMutationId] = useState<string | null>(null);
    const [inviteMutationId, setInviteMutationId] = useState<string | null>(null);
    const [inviteCreatePending, setInviteCreatePending] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRoleId, setInviteRoleId] = useState<string | undefined>(undefined);
    const [inviteBranchId, setInviteBranchId] = useState<string | undefined>(undefined);

    const roleOptions = roles.filter((role) => !!role.id);

    useEffect(() => {
        if (actionError) {
            toast.error(actionError);
        }
    }, [actionError]);

    const filteredMembers = useMemo(() => {
        const query = memberQuery.trim().toLowerCase();
        if (!query) return membersState;
        return membersState.filter((member) => {
            const roleLabel = (member.roleName || member.role || "").toLowerCase();
            const branchLabel = (member.primaryBranch?.name || "").toLowerCase();
            return (
                member.name.toLowerCase().includes(query) ||
                member.email.toLowerCase().includes(query) ||
                roleLabel.includes(query) ||
                branchLabel.includes(query)
            );
        });
    }, [memberQuery, membersState]);

    const filteredInvites = useMemo(() => {
        const query = inviteQuery.trim().toLowerCase();
        if (!query) return invitesState;
        return invitesState.filter((invite) => {
            const roleLabel = (invite.roleName || invite.role || "").toLowerCase();
            const statusLabel = (invite.status || "").toLowerCase();
            return (
                invite.email.toLowerCase().includes(query) ||
                roleLabel.includes(query) ||
                statusLabel.includes(query)
            );
        });
    }, [inviteQuery, invitesState]);

    const openRoleSheet = (member: MemberRecord) => {
        setActionError(null);
        setActiveMember(member);
        setSelectedRoleId(member.roleId || roleOptions[0]?.id || "");
        setRoleSheetOpen(true);
    };

    const handleSaveRole = () => {
        if (!activeMember || !selectedRoleId) return;
        setActionError(null);
        setMemberMutationId(activeMember.id);

        startTransition(async () => {
            const result = await updateMemberRoleAction(activeMember.id, selectedRoleId);
            if (!result.ok) {
                setActionError(result.error);
                setMemberMutationId(null);
                return;
            }

            const selectedRole = roleOptions.find((role) => role.id === selectedRoleId);
            setMembersState((prev) =>
                prev.map((member) =>
                    member.id === activeMember.id
                        ? {
                              ...member,
                              roleId: selectedRoleId,
                              roleName: selectedRole?.name ?? member.roleName ?? member.role,
                              role: selectedRole?.slug ?? member.role,
                          }
                        : member
                )
            );

            setRoleSheetOpen(false);
            setMemberMutationId(null);
        });
    };

    const handleToggleStatus = (member: MemberRecord) => {
        const nextStatus = member.status === "active" ? "inactive" : "active";
        setActionError(null);
        setMemberMutationId(member.id);

        startTransition(async () => {
            const result = await updateMemberStatusAction(member.id, nextStatus);
            if (!result.ok) {
                setActionError(result.error);
                setMemberMutationId(null);
                return;
            }

            setMembersState((prev) =>
                prev.map((row) => (row.id === member.id ? { ...row, status: nextStatus } : row))
            );

            setMemberMutationId(null);
        });
    };

    const handleResendInvite = (invite: InviteRecord) => {
        setActionError(null);
        setInviteMutationId(invite.id);

        startTransition(async () => {
            const result = await resendInviteAction(invite.id);
            if (!result.ok) {
                setActionError(result.error);
                setInviteMutationId(null);
                return;
            }

            setInvitesState((prev) =>
                prev.map((row) => (row.id === invite.id ? { ...row, ...result.data } : row))
            );

            setInviteMutationId(null);
        });
    };

    const handleCancelInvite = (invite: InviteRecord) => {
        setActionError(null);
        setInviteMutationId(invite.id);

        startTransition(async () => {
            const result = await cancelInviteAction(invite.id);
            if (!result.ok) {
                setActionError(result.error);
                setInviteMutationId(null);
                return;
            }

            setInvitesState((prev) =>
                prev.map((row) => (row.id === invite.id ? { ...row, ...result.data } : row))
            );

            setInviteMutationId(null);
        });
    };

    const handleCreateInvite = () => {
        const email = inviteEmail.trim();
        if (!email) {
            setActionError("Email wajib diisi.");
            return;
        }

        setActionError(null);
        setInviteCreatePending(true);

        startTransition(async () => {
            const result = await createInviteAction({
                email,
                roleId: inviteRoleId,
                branchId: inviteBranchId,
            });

            if (!result.ok) {
                setActionError(result.error);
                setInviteCreatePending(false);
                return;
            }

            setInvitesState((prev) => [result.data, ...prev]);
            setInviteEmail("");
            setInviteRoleId(undefined);
            setInviteBranchId(undefined);
            setInviteOpen(false);
            setInviteCreatePending(false);
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Tim & Akses</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Kelola user, role, dan undangan dalam satu tempat.
                    </p>
                    {actionError ? (
                        <p className="text-xs text-destructive mt-2">{actionError}</p>
                    ) : null}
                </div>
                <Button className="h-9 text-xs font-semibold" onClick={() => setInviteOpen(true)}>
                    Undang Anggota
                </Button>
            </div>

            <Tabs defaultValue="members">
                <TabsList className="bg-muted/40">
                    <TabsTrigger value="members" className="text-xs">Anggota</TabsTrigger>
                    <TabsTrigger value="roles" className="text-xs">Role & Izin</TabsTrigger>
                    <TabsTrigger value="invites" className="text-xs">Undangan</TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="mt-4">
                    <div className="rounded-xl border border-border/60 bg-card">
                        <div className="flex flex-col gap-3 border-b border-border/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">Daftar Anggota</h2>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Total {filteredMembers.length} anggota.
                                </p>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={memberQuery}
                                    onChange={(event) => setMemberQuery(event.target.value)}
                                    placeholder="Cari nama, email, role..."
                                    className="h-9 pl-9"
                                />
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Cabang</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Bergabung</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMembers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">
                                            Belum ada anggota.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredMembers.map((member) => {
                                        const statusLabel = formatMemberStatus(member.status);
                                        return (
                                            <TableRow key={member.id}>
                                                <TableCell className="font-semibold">{member.name}</TableCell>
                                                <TableCell>{member.email}</TableCell>
                                                <TableCell>{member.roleName || member.role || "-"}</TableCell>
                                                <TableCell>{member.primaryBranch?.name || "-"}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "border text-[11px] font-semibold",
                                                            statusLabel === "Aktif"
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                : "bg-muted/50 text-muted-foreground border-border"
                                                        )}
                                                    >
                                                        {statusLabel}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-xs">
                                                    {formatJoinedAt(member.joinedAt)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            className="h-8 text-xs font-semibold"
                                                            onClick={() => openRoleSheet(member)}
                                                            disabled={memberMutationId === member.id || isPending}
                                                        >
                                                            Edit Role
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="h-8 text-xs font-semibold"
                                                            onClick={() => handleToggleStatus(member)}
                                                            disabled={memberMutationId === member.id || isPending}
                                                        >
                                                            {member.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="roles" className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Role & Izin</h2>
                            <p className="text-xs text-muted-foreground mt-1">Klik role untuk melihat izin.</p>
                        </div>
                        <Button variant="outline" className="h-9 text-xs font-semibold" asChild>
                            <Link href="/tim/roles/new">Buat Role Baru</Link>
                        </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {roleOptions.length === 0 ? (
                            <div className="rounded-xl border border-border/60 bg-card p-4">
                                <p className="text-sm font-semibold text-foreground">Belum ada role</p>
                                <p className="text-xs text-muted-foreground mt-1">Tambahkan role untuk membagi akses.</p>
                                <Button variant="outline" className="h-8 text-xs font-semibold mt-3" asChild>
                                    <Link href="/tim/roles/new">Buat Role Baru</Link>
                                </Button>
                            </div>
                        ) : (
                            roleOptions.map((role) => (
                                <div key={role.id} className="rounded-xl border border-border/60 bg-card p-4">
                                    <p className="text-sm font-semibold text-foreground">{role.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {role.permissionsCount ?? 0} modul aktif
                                    </p>
                                    <Button variant="outline" className="h-8 text-xs font-semibold mt-3" asChild>
                                        <Link href={`/tim/roles/${role.id}`}>Lihat Izin</Link>
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="invites" className="mt-4">
                    <div className="rounded-xl border border-border/60 bg-card">
                        <div className="flex flex-col gap-3 border-b border-border/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">Daftar Undangan</h2>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Total {filteredInvites.length} undangan.
                                </p>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={inviteQuery}
                                    onChange={(event) => setInviteQuery(event.target.value)}
                                    placeholder="Cari email atau status..."
                                    className="h-9 pl-9"
                                />
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tanggal Kirim</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInvites.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">
                                            Belum ada undangan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredInvites.map((invite) => {
                                        const statusLabel = formatInviteStatus(invite.status);
                                        return (
                                            <TableRow key={invite.id}>
                                                <TableCell className="font-semibold">{invite.email}</TableCell>
                                                <TableCell>{invite.roleName || invite.role || "-"}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "border text-[11px] font-semibold",
                                                            statusLabel === "Pending"
                                                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                                                : "bg-muted/50 text-muted-foreground border-border"
                                                        )}
                                                    >
                                                        {statusLabel}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-xs">
                                                    {formatInviteSent(invite.sentAt)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            className="h-8 text-xs font-semibold"
                                                            onClick={() => handleResendInvite(invite)}
                                                            disabled={inviteMutationId === invite.id || isPending}
                                                        >
                                                            Kirim Ulang
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="h-8 text-xs font-semibold"
                                                            onClick={() => handleCancelInvite(invite)}
                                                            disabled={inviteMutationId === invite.id || isPending}
                                                        >
                                                            Batalkan
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            <Sheet
                open={roleSheetOpen}
                onOpenChange={(open) => {
                    setRoleSheetOpen(open);
                    if (!open) {
                        setActiveMember(null);
                        setSelectedRoleId("");
                    }
                }}
            >
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Ubah Role</SheetTitle>
                        <SheetDescription>
                            {activeMember ? `Atur role untuk ${activeMember.name}.` : "Pilih role yang sesuai."}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-3">
                        <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roleOptions.length === 0 ? (
                                    <SelectItem value="none" disabled>
                                        Tidak ada role
                                    </SelectItem>
                                ) : (
                                    roleOptions.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>
                                            {role.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <SheetFooter className="mt-6">
                        <Button
                            className="w-full h-9 text-xs font-semibold"
                            onClick={handleSaveRole}
                            disabled={
                                !selectedRoleId ||
                                (activeMember ? memberMutationId === activeMember.id : false) ||
                                isPending
                            }
                        >
                            Simpan Perubahan
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <Sheet
                open={inviteOpen}
                onOpenChange={(open) => {
                    setInviteOpen(open);
                    if (!open) {
                        setInviteEmail("");
                        setInviteRoleId(undefined);
                        setInviteBranchId(undefined);
                        setActionError(null);
                    }
                }}
            >
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Undang Anggota</SheetTitle>
                        <SheetDescription>
                            Kirim undangan ke anggota baru.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-3">
                        <Input
                            placeholder="Email anggota"
                            value={inviteEmail}
                            onChange={(event) => setInviteEmail(event.target.value)}
                        />
                        <Select value={inviteRoleId} onValueChange={setInviteRoleId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roleOptions.length === 0 ? (
                                    <SelectItem value="none" disabled>
                                        Tidak ada role
                                    </SelectItem>
                                ) : (
                                    roleOptions.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>
                                            {role.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <Select value={inviteBranchId} onValueChange={setInviteBranchId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Assign cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                {normalizedBranches.length === 0 ? (
                                    <SelectItem value="none" disabled>
                                        Tidak ada cabang
                                    </SelectItem>
                                ) : (
                                    normalizedBranches.map((branch) => (
                                        <SelectItem key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <SheetFooter className="mt-6">
                        <Button
                            className="w-full h-9 text-xs font-semibold"
                            onClick={handleCreateInvite}
                            disabled={inviteCreatePending || isPending}
                        >
                            Kirim Undangan
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
