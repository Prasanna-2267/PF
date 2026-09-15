import { api } from "@/lib/api";
import type { LearnerPreferenceDto } from "@/lib/learner-preferences";
import type { NotificationPreferences } from "@/lib/notification-api";

export type StudentAccount = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  createdAt: string;
  activeAcademy: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    city: string;
    state: string;
  } | null;
  learnerPreference: LearnerPreferenceDto | null;
  learnerNotificationPreference: NotificationPreferences | null;
};
export type AccountChallenge = {
  challengeId: string;
  purpose: "EMAIL_CHANGE" | "MOBILE_CHANGE" | "DELETE_ACCOUNT";
  stage?: "CURRENT_EMAIL" | "NEW_EMAIL";
  maskedTarget: string;
  expiresAt: string;
  resendAfter: string;
  developmentCode?: string;
};

export const getStudentAccount = async () =>
  (await api.get<StudentAccount>("/student/account")).data;
export const updateAccountName = async (fullName: string) =>
  (await api.patch("/student/account/name", { fullName })).data;
export const requestEmailChange = async (email: string) =>
  (
    await api.post<AccountChallenge>("/student/account/email/change/request", {
      email,
    })
  ).data;
export const verifyCurrentEmailChange = async (
  challengeId: string,
  code: string,
) =>
  (
    await api.post<AccountChallenge>(
      "/student/account/email/change/verify-current",
      { challengeId, code },
    )
  ).data;
export const confirmEmailChange = async (challengeId: string, code: string) =>
  (
    await api.post("/student/account/email/change/confirm", {
      challengeId,
      code,
    })
  ).data;
export const resendEmailChange = async (challengeId: string) =>
  (
    await api.post<AccountChallenge>("/student/account/email/change/resend", {
      challengeId,
    })
  ).data;
export const requestMobileChange = async (mobile: string) =>
  (
    await api.post<AccountChallenge>("/student/account/mobile/change/request", {
      mobile,
    })
  ).data;
export const confirmMobileChange = async (challengeId: string, code: string) =>
  (
    await api.post("/student/account/mobile/change/confirm", {
      challengeId,
      code,
    })
  ).data;
export const updateAccountExam = async (input: {
  examMonth: number;
  examYear: number;
  examDay?: number;
  expectedVersion?: number;
}) =>
  (await api.patch<LearnerPreferenceDto>("/student/account/exam", input)).data;
export const updateStudyTarget = async (
  dailyTargetMinutes: number,
  expectedVersion?: number,
) =>
  (
    await api.patch<LearnerPreferenceDto>("/student/account/study-target", {
      dailyTargetMinutes,
      expectedVersion,
    })
  ).data;
export const updateAccountAppearance = async (
  preferredTheme: "LIGHT" | "DARK",
  expectedVersion?: number,
) =>
  (
    await api.patch<LearnerPreferenceDto>("/student/account/appearance", {
      preferredTheme,
      expectedVersion,
    })
  ).data;
export const requestAccountDeletion = async () =>
  (await api.post<AccountChallenge>("/student/account/delete/request", {}))
    .data;
export const verifyAccountDeletion = async (
  challengeId: string,
  code: string,
) =>
  (await api.post("/student/account/delete/verify", { challengeId, code }))
    .data;
