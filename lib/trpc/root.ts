import { router } from "./server";
import { pagesRouter } from "./routers/pages";
import { widgetsRouter } from "./routers/widgets";
import { integrationsRouter } from "./routers/integrations";
import { settingsRouter } from "./routers/settings";
import { notificationsRouter } from "./routers/notifications";

export const appRouter = router({
  pages: pagesRouter,
  widgets: widgetsRouter,
  integrations: integrationsRouter,
  settings: settingsRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
