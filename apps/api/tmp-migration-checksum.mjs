import fs from "node:fs";
import crypto from "node:crypto";
const file = fs.readFileSync("prisma/migrations/20260701_residual_drift_reconcile/migration.sql");
console.log(crypto.createHash("sha256").update(file).digest("hex"));
