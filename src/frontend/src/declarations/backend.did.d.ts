/* eslint-disable */
// @ts-nocheck
import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';
import type { Principal } from '@icp-sdk/core/principal';

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
    reportingTime: [] | [string];
    workType: string;
    dutyRole: string;
    orderNo: string;
    remunerationAmount: number;
    remunerationCredited: boolean;
    remunerationCreditDate: [] | [bigint];
    taEligible: boolean;
    taAmount: [] | [number];
    taSubmissionStatus: [] | [string];
    taCredited: [] | [boolean];
    taCreditDate: [] | [bigint];
    orderDocumentId: [] | [string];
    remarks: [] | [string];
    createdAt: bigint;
}

export interface DutyEntryInput {
    userId: bigint;
    dutyDate: bigint;
    reportingTime: [] | [string];
    workType: string;
    dutyRole: string;
    orderNo: string;
    remunerationAmount: number;
    remunerationCredited: boolean;
    remunerationCreditDate: [] | [bigint];
    taEligible: boolean;
    taAmount: [] | [number];
    taSubmissionStatus: [] | [string];
    taCredited: [] | [boolean];
    taCreditDate: [] | [bigint];
    orderDocumentId: [] | [string];
    remarks: [] | [string];
}

export interface LeaveEntry {
    id: bigint;
    userId: bigint;
    leaveType: string;
    holidayDutyDate: [] | [bigint];
    sanctionedDate: [] | [bigint];
    sanctionedOD: [] | [bigint];
    orderDocumentLeaveId: [] | [string];
    orderNumber: string;
    availed: boolean;
    availedDates: bigint[];
    remarks: [] | [string];
    createdAt: bigint;
}

export interface LeaveEntryInput {
    userId: bigint;
    leaveType: string;
    holidayDutyDate: [] | [bigint];
    sanctionedDate: [] | [bigint];
    sanctionedOD: [] | [bigint];
    orderDocumentLeaveId: [] | [string];
    orderNumber: string;
    availed: boolean;
    availedDates: bigint[];
    remarks: [] | [string];
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

export interface _SERVICE {
    registerUser: ActorMethod<[string, string, string], [] | [User]>;
    loginUser: ActorMethod<[string, string], [] | [User]>;
    getUserCount: ActorMethod<[], bigint>;
    addDutyEntry: ActorMethod<[DutyEntryInput], bigint>;
    getAllDutyEntries: ActorMethod<[], DutyEntry[]>;
    getDutyEntriesByUser: ActorMethod<[bigint], DutyEntry[]>;
    getDutyEntry: ActorMethod<[bigint], [] | [DutyEntry]>;
    updateDutyEntry: ActorMethod<[bigint, DutyEntryInput], boolean>;
    deleteDutyEntry: ActorMethod<[bigint], boolean>;
    addLeaveEntry: ActorMethod<[LeaveEntryInput], bigint>;
    getAllLeaveEntries: ActorMethod<[], LeaveEntry[]>;
    getLeaveEntriesByUser: ActorMethod<[bigint], LeaveEntry[]>;
    getLeaveEntry: ActorMethod<[bigint], [] | [LeaveEntry]>;
    updateLeaveEntry: ActorMethod<[bigint, LeaveEntryInput], boolean>;
    deleteLeaveEntry: ActorMethod<[bigint], boolean>;
    addUpcomingDuty: ActorMethod<[UpcomingDutyInput], bigint>;
    getAllUpcomingDuties: ActorMethod<[], UpcomingDuty[]>;
    getUpcomingDutiesByUser: ActorMethod<[bigint], UpcomingDuty[]>;
    getUpcomingDuty: ActorMethod<[bigint], [] | [UpcomingDuty]>;
    updateUpcomingDuty: ActorMethod<[bigint, UpcomingDutyInput], boolean>;
    deleteUpcomingDuty: ActorMethod<[bigint], boolean>;
    markUpcomingDutyCompleted: ActorMethod<[bigint], boolean>;
    markUpcomingDutyMissed: ActorMethod<[bigint], boolean>;
    startUpload: ActorMethod<[string, string, bigint], string>;
    uploadChunk: ActorMethod<[string, bigint, Uint8Array], boolean>;
    finalizeUpload: ActorMethod<[string], string>;
    deleteBlob: ActorMethod<[string], boolean>;
}
export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
