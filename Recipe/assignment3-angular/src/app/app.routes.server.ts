import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'recipes/:recipeId-31477046',
    renderMode: RenderMode.Client
  },
  {
    path: 'recipes/:recipeId/update-31477046',
    renderMode: RenderMode.Client
  },
  {
    path: 'inventory-dashboard-31477046',
    renderMode: RenderMode.Client
  },
  {
    path: 'add-inventory-31477046',
    renderMode: RenderMode.Client
  },
  {
    path: 'inventory-dashboard/:inventoryId/update-31477046',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
