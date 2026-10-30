import { formatFindings, hasErrors, inspectEnvironment } from "./env-check";
import { loadEnvFile } from "./grant-runtime-role";

function main(): void {
  const env = { ...loadEnvFile(), ...process.env };
  const findings = inspectEnvironment(env);

  console.log("Checking the database configuration in .env");
  if (findings.length === 0) {
    console.log("  ok   nothing to report");
  } else {
    console.log(formatFindings(findings));
  }

  const errors = findings.filter((finding) => finding.level === "error").length;
  const warnings = findings.filter((finding) => finding.level === "warn").length;

  console.log(`\n${errors} error(s), ${warnings} warning(s)`);
  if (hasErrors(findings)) {
    console.log("\nFix the errors above, then run `npm run db:setup` again.");
    process.exit(1);
  }
  console.log("\nRun `npm run db:setup` to apply the migrations and wire the runtime role.");
}

main();
