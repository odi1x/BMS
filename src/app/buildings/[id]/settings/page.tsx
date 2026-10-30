import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BuildingSettingsForm } from "@/components/settings/BuildingSettingsForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { requireUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { imageKitConfigured, transformedUrl } from "@/lib/imagekit";
import { getLocale } from "@/lib/preferences";
import { loadBuildingSnapshot } from "@/lib/queries";

export const metadata: Metadata = { title: "بيانات الجمعية" };

export default async function BuildingSettingsPage({
  params,
}: PageProps<"/buildings/[id]/settings">) {
  const { id } = await params;
  const user = await requireUser();
  const snapshot = await loadBuildingSnapshot(user, id);
  if (!snapshot) notFound();

  const locale = await getLocale();
  const dict = getDict(locale);
  const { building } = snapshot;

  const previewVoucherNo =
    snapshot.monthRevenues.reduce(
      (max, row) => Math.max(max, Number(row.voucherNo) || 0),
      0,
    ) + 1;

  return (
    <>
      <PageHeader title={dict["settings.title"]} finding={dict["settings.subtitle"]} />

      <Panel title={dict["settings.formTitle"]} hint={dict["settings.formHint"]}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <BuildingSettingsForm
            building={{
              id: building.id,
              name: building.name,
              registrationNo: building.registrationNo ?? "",
              unifiedId: building.unifiedId ?? "",
              chairmanName: building.chairmanName ?? "",
              address: building.address ?? "",
              iban: building.iban ?? "",
              stampUrl: building.stampUrl,
            }}
            imageKitReady={imageKitConfigured()}
            labels={{
              name: dict["settings.name"],
              registrationNo: dict["settings.registrationNo"],
              unifiedId: dict["settings.unifiedId"],
              chairmanName: dict["settings.chairmanName"],
              address: dict["settings.address"],
              iban: dict["settings.iban"],
              stamp: dict["settings.stamp"],
              stampHint: dict["settings.stampHint"],
              upload: dict["settings.upload"],
              save: dict["common.save"],
              saving: dict["common.saving"],
              saved: dict["common.saved"],
              required: dict["auth.required"],
            }}
          />

          <section className="min-w-0 xl:border-s xl:border-divider xl:ps-6">
            <h3 className="text-[13px] font-semibold">{dict["settings.preview"]}</h3>
            <p className="mt-0.5 text-[12px] text-ink-faint">{dict["settings.previewHint"]}</p>
            <div className="mt-3 rounded-[10px] border border-line bg-sunk p-4">
              <div className="flex items-start justify-between gap-4 border-b border-line-strong pb-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold">{building.name}</p>
                  <p className="mt-1 text-[12px] text-ink-muted">
                    {dict["financial.registration"]}:{" "}
                    <span className="num">{building.registrationNo ?? "—"}</span>
                    {" · "}
                    {dict["financial.unified"]}:{" "}
                    <span className="num">{building.unifiedId ?? "—"}</span>
                  </p>
                  <p className="text-[12px] text-ink-muted">{building.address}</p>
                </div>
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-dashed border-line-strong text-[10px] text-ink-faint">
                  {building.stampUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={transformedUrl(building.stampUrl, 220, 220)}
                      alt={dict["settings.stamp"]}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    dict["voucher.receiptSeal"]
                  )}
                </div>
              </div>
              <p className="mt-3 text-[13px] font-semibold">
                {dict["voucher.title"]} · {dict["voucher.number"]}{" "}
                <span className="num">{previewVoucherNo}</span>
              </p>
              <p className="mt-1 text-[12px] text-ink-muted">
                {building.chairmanName} · {dict["financial.chairman"]}
              </p>
            </div>
            <p className="mt-3 text-[13px] text-ink-muted">{dict["settings.previewNote"]}</p>
          </section>
        </div>
      </Panel>
    </>
  );
}
