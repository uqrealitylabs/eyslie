import type { ExpressionLevel } from "../../../src/state/livingTextOptions.js";
import type { LivingTextMood } from "../../../src/state/livingTextMachine.js";

export type DemoLocaleContent = {
  label: string;
  thoughts: Record<ExpressionLevel, Record<LivingTextMood, string>>;
};

export type DemoLocaleCatalog = Readonly<
  Record<string, DemoLocaleContent>
>;

export function resolveThoughtLocale(
  catalog: DemoLocaleCatalog,
  requested: string,
  fallback = "und",
) {
  const own = (locale: string) =>
    Object.hasOwn(catalog, locale) ? locale : undefined;
  const safeFallback =
    own(fallback) ?? own("und") ?? Object.keys(catalog).at(0);
  if (!safeFallback) throw new Error("thought locale catalog is empty");

  try {
    const locale = new Intl.Locale(requested);
    const script = locale.script ?? locale.maximize().script;
    const candidates = [
      locale.baseName,
      script ? `${locale.language}-${script}` : "",
    ];
    if (
      !locale.script ||
      new Intl.Locale(locale.language).maximize().script === locale.script
    ) {
      candidates.push(locale.language);
    }
    return candidates.filter(Boolean).map(own).find(Boolean) ?? safeFallback;
  } catch {
    return safeFallback;
  }
}
