/** Result returned by forms that save editable application data. */
export interface FormActionState {
  error: string | null;
  success: string | null;
}

export const initialFormActionState: FormActionState = {
  error: null,
  success: null,
};

export function formError(error: string): FormActionState {
  return { error, success: null };
}

export function formSuccess(success: string): FormActionState {
  return { error: null, success };
}
