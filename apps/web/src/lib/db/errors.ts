// Shared between the server query layer and client components. These helpers
// cannot live in queries.ts: that file is "use server", where every runtime
// export must be an async server action.
//
// When a real DB is configured, a failed write must surface to the user instead
// of falling back to the in-memory mock store — the mock "success" evaporates on
// the next serverless invocation, which silently loses the data. Thrown
// server-action errors get masked by Next.js in production, so writes return a
// structured { error } object the UI can check for with isDbWriteError().
export type DbWriteError = { error: string };

export const isDbWriteError = (result: unknown): result is DbWriteError =>
  typeof result === 'object' && result !== null && 'error' in result &&
  typeof (result as DbWriteError).error === 'string';

const dbErrorDetails = (e: unknown): { code?: string; msg: string } => {
  const cause = (e as { cause?: { code?: string; message?: string } })?.cause;
  const code = (e as { code?: string })?.code ?? cause?.code;
  const msg = [e instanceof Error ? e.message : String(e), cause?.message]
    .filter(Boolean)
    .join(' ');
  return { code, msg };
};

const isUniqueViolation = (e: unknown): boolean => {
  const { code, msg } = dbErrorDetails(e);
  return code === '23505' || /duplicate key|unique constraint/i.test(msg);
};

export const dbWriteError = (e: unknown): DbWriteError => {
  if (isUniqueViolation(e)) {
    return { error: 'A record with the same unique value already exists.' };
  }
  return { error: 'Failed to save to the database. Please try again.' };
};

export const invoiceSaveError = (e: unknown, invoiceNumber?: string | null): DbWriteError => {
  if (isUniqueViolation(e)) {
    return {
      error: `Invoice number ${invoiceNumber || ''} already exists. Use a different invoice number.`.replace(/\s+/g, ' '),
    };
  }
  return { error: 'Failed to save the invoice to the database. Please try again.' };
};
