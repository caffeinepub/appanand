import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;

export interface User {
    id: bigint;
    name: string;
    username: string;
    password: string;
    createdAt: bigint;
}

export interface DutyEntry {
    id: bigint;
    userId: bigint;
    dutyDate: bigint;
    reportingTime: Option<string>;
    workType: string;
    dutyRole: string;
    orderNo: string;
    remunerationAmount: number;
    remunerationCredited: boolean;
    remunerationCreditDate: Option<bigint>;
    taEligible: boolean;
    taAmount: Option<number>;
    taSubmissionStatus: Option<string>;
    taCredited: Option<boolean>;
    taCreditDate: Option<bigint>;
    orderDocumentId: Option<string>;
    remarks: Option<string>;
    createdAt: bigint;
}

export interface DutyEntryInput {
    userId: bigint;
    dutyDate: bigint;
    reportingTime: Option<string>;
    workType: string;
    dutyRole: string;
    orderNo: string;
    remunerationAmount: number;
    remunerationCredited: boolean;
    remunerationCreditDate: Option<bigint>;
    taEligible: boolean;
    taAmount: Option<number>;
    taSubmissionStatus: Option<string>;
    taCredited: Option<boolean>;
    taCreditDate: Option<bigint>;
    orderDocumentId: Option<string>;
    remarks: Option<string>;
}

export interface LeaveEntry {
    id: bigint;
    userId: bigint;
    leaveType: string;
    holidayDutyDate: Option<bigint>;
    sanctionedDate: Option<bigint>;
    sanctionedOD: Option<bigint>;
    orderDocumentLeaveId: Option<string>;
    orderNumber: string;
    availed: boolean;
    availedDates: bigint[];
    remarks: Option<string>;
    createdAt: bigint;
}

export interface LeaveEntryInput {
    userId: bigint;
    leaveType: string;
    holidayDutyDate: Option<bigint>;
    sanctionedDate: Option<bigint>;
    sanctionedOD: Option<bigint>;
    orderDocumentLeaveId: Option<string>;
    orderNumber: string;
    availed: boolean;
    availedDates: bigint[];
    remarks: Option<string>;
}

export interface UpcomingDuty {
    id: bigint;
    userId: bigint;
    dutyDate: bigint;
    reportingTime: string;
    workType: string;
    dutyRole: string;
    orderNumber: string;
    reminderEnabled: boolean;
    status: string;
    createdAt: bigint;
}

export interface UpcomingDutyInput {
    userId: bigint;
    dutyDate: bigint;
    reportingTime: string;
    workType: string;
    dutyRole: string;
    orderNumber: string;
    reminderEnabled: boolean;
    status: string;
}

export interface backendInterface {
    registerUser(name: string, username: string, password: string): Promise<Option<User>>;
    loginUser(username: string, password: string): Promise<Option<User>>;
    getUserCount(): Promise<bigint>;
    addDutyEntry(input: DutyEntryInput): Promise<bigint>;
    getAllDutyEntries(): Promise<DutyEntry[]>;
    getDutyEntriesByUser(userId: bigint): Promise<DutyEntry[]>;
    getDutyEntry(id: bigint): Promise<Option<DutyEntry>>;
    updateDutyEntry(id: bigint, input: DutyEntryInput): Promise<boolean>;
    deleteDutyEntry(id: bigint): Promise<boolean>;
    addLeaveEntry(input: LeaveEntryInput): Promise<bigint>;
    getAllLeaveEntries(): Promise<LeaveEntry[]>;
    getLeaveEntriesByUser(userId: bigint): Promise<LeaveEntry[]>;
    getLeaveEntry(id: bigint): Promise<Option<LeaveEntry>>;
    updateLeaveEntry(id: bigint, input: LeaveEntryInput): Promise<boolean>;
    deleteLeaveEntry(id: bigint): Promise<boolean>;
    addUpcomingDuty(input: UpcomingDutyInput): Promise<bigint>;
    getAllUpcomingDuties(): Promise<UpcomingDuty[]>;
    getUpcomingDutiesByUser(userId: bigint): Promise<UpcomingDuty[]>;
    getUpcomingDuty(id: bigint): Promise<Option<UpcomingDuty>>;
    updateUpcomingDuty(id: bigint, input: UpcomingDutyInput): Promise<boolean>;
    deleteUpcomingDuty(id: bigint): Promise<boolean>;
    markUpcomingDutyCompleted(id: bigint): Promise<boolean>;
    markUpcomingDutyMissed(id: bigint): Promise<boolean>;
}
