"use client";

import { FormProvider, useForm, useWatch } from "react-hook-form";

import { defaultInvoiceValues, type InvoiceFormValues } from "@shared/features/invoice/data";
import { InvoiceForm } from "@shared/features/invoice/invoice-form";
import { InvoicePreview } from "@shared/features/invoice/invoice-preview";

export function Invoice() {
  const form = useForm<InvoiceFormValues>({
    defaultValues: defaultInvoiceValues,
  });
  const invoice = useWatch({ control: form.control }) as InvoiceFormValues;

  return (
    <FormProvider {...form}>
      <form className="grid gap-5 xl:grid-cols-2" noValidate onSubmit={(event) => event.preventDefault()}>
        <InvoiceForm />
        <InvoicePreview invoice={invoice} />
      </form>
    </FormProvider>
  );
}
