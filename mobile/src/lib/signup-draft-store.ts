import { create } from 'zustand';

type SignupDraft = {
  name: string;
  phone: string;
  email: string;
  password: string;
  devicePolicyAccepted: boolean;
  admissionCode: string;
  admissionProof: string;
  academyId: string;
  academyName: string;
};

type SignupDraftStore = SignupDraft & {
  update: (patch: Partial<SignupDraft>) => void;
  clear: () => void;
};

const emptyDraft: SignupDraft = {
  name: '', phone: '', email: '', password: '', devicePolicyAccepted: false,
  admissionCode: '', admissionProof: '', academyId: '', academyName: '',
};

// Memory-only by design: survives the scanner round-trip without persisting
// the password or exposing it through navigation parameters.
export const useSignupDraftStore = create<SignupDraftStore>((set) => ({
  ...emptyDraft,
  update: (patch) => set(patch),
  clear: () => set(emptyDraft),
}));
