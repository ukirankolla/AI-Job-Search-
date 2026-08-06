export type FormState = {
  ok: boolean;
  message?: string;
  error?: string;
};

export const initialState: FormState = { ok: false, message: "" };
