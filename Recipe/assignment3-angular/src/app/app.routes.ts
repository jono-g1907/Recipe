import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { Logout } from './auth/logout/logout';
import { Dashboard } from './dashboard/dashboard';
import { RecipeList } from './recipes/recipe-list/recipe-list';
import { RecipeCreate } from './recipes/recipe-create/recipe-create';
import { RecipeDetail } from './recipes/recipe-detail/recipe-detail';
import { RecipeEdit } from './recipes/recipe-edit/recipe-edit';
import { InventoryList } from './inventory/inventory-list/inventory-list';
import { InventoryCreate } from './inventory/inventory-create/inventory-create';
import { InventoryEdit } from './inventory/inventory-edit/inventory-edit';
import { NotFound } from './errors/not-found/not-found';
import { authChildGuard, authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: '',
    canActivateChild: [authChildGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: Dashboard },
      { path: 'logout', component: Logout, canActivate: [authGuard] },
      { path: 'recipes-list-31477046', component: RecipeList },
      { path: 'add-recipe-31477046', component: RecipeCreate },
      { path: 'recipes/:recipeId/update-31477046', component: RecipeEdit },
      { path: 'recipes/:recipeKey', component: RecipeDetail },
      { path: 'inventory-dashboard-31477046', component: InventoryList },
      { path: 'add-inventory-31477046', component: InventoryCreate },
      { path: 'inventory-dashboard/:inventoryId/update-31477046', component: InventoryEdit }
    ]
  },
  { path: '**', component: NotFound }
];
