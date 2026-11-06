import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { ProductMark } from "@/components/shell/ProductMark";
import { getSession } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { getLocale } from "@/lib/preferences";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "ADMIN" ? "/" : `/buildings/${session.buildingId}`);
  }

  const locale = await getLocale();
  const dict = getDict(locale);

  const jobs = [
    { title: dict["nav.revenues"], text: dict["revenues.subtitle"] },
    { title: dict["nav.expenses"], text: dict["expenses.subtitle"] },
    { title: dict["nav.financial"], text: dict["financial.subtitle"] },
  ];

  return (
    <main className="flex min-h-dvh flex-col">
      <div className="grid flex-1 items-center gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:px-14">
        <section className="w-full">
          <div className="panel px-5 py-6">
            <h1 className="text-[24px] leading-tight font-semibold tracking-[-0.02em]">
              {dict["auth.title"]}
            </h1>
            <p className="mt-1.5 text-[14px] text-ink-muted">{dict["auth.subtitle"]}</p>

            <div className="mt-5">
              <LoginForm
                emailLabel={dict["auth.email"]}
                passwordLabel={dict["auth.password"]}
                signInLabel={dict["auth.signIn"]}
                savingLabel={dict["common.saving"]}
                invalidLabel={dict["auth.invalid"]}
                requiredLabel={dict["auth.required"]}
              />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-10">
          <div className="flex items-center gap-3">
            <ProductMark size={40} />
            <span className="flex flex-col leading-tight">
              <span className="text-[26px] font-semibold tracking-[-0.02em]">
                {dict["product.name"]}
              </span>
              <span className="mt-1 text-[14px] text-ink-faint">{dict["dashboard.subtitle"]}</span>
            </span>
          </div>

          <ul className="flex flex-col border-t border-divider">
            {jobs.map((job) => (
              <li
                key={job.title}
                className="flex items-baseline justify-between gap-6 border-b border-divider py-6"
              >
                <span className="text-[16px] font-medium text-ink">{job.title}</span>
                <span className="text-[14px] text-ink-muted">{job.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
