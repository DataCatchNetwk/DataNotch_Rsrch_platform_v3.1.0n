// Add to apps/api/src/app.ts or wherever routes are registered.

import workspaceIntakeRoutes from "./routes/workspace-intake.routes";

app.use("/api/workspace-intake", workspaceIntakeRoutes);
