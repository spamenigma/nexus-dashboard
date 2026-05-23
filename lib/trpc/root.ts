import { router } from "./server";
import { pagesRouter } from "./routers/pages";
import { widgetsRouter } from "./routers/widgets";
import { integrationsRouter } from "./routers/integrations";
import { settingsRouter } from "./routers/settings";

export const appRouter = router({
  pages: pagesRouter,
  widgets: widgetsRouter,
  integrations: integrationsRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
