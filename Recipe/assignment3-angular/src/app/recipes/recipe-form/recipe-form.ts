// T3 Import Angular form helpers to power the reusable recipe form component.
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Recipe, RecipeIngredient } from '../recipe.model';
import { RecipePayload } from '../recipe.service';

export type RecipeFormValue = Omit<RecipePayload, 'userId'>;

interface IngredientForm {
  ingredientName: FormControl<string>;
  quantity: FormControl<number | null>;
  unit: FormControl<string>;
}

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './recipe-form.html',
  styleUrl: './recipe-form.css'
})
export class RecipeForm implements OnChanges {
  private readonly fb = inject(FormBuilder);

  // T3 Allow parent components to prefill data, customize labels, and react to submit events.
  @Input() initialRecipe: Recipe | null = null;
  @Input() submitLabel = 'Save Recipe';
  @Input() loading = false;
  @Input() errorMessage = '';
  @Output() submitted = new EventEmitter<RecipeFormValue>();

  // T3 Provide dropdown choices to keep form options consistent across the app.
  readonly mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  readonly cuisineTypes = ['Italian', 'Asian', 'Mexican', 'American', 'French', 'Indian', 'Mediterranean', 'Other'];
  readonly difficultyOptions = ['Easy', 'Medium', 'Hard'];
  readonly unitOptions = ['pieces', 'kg', 'g', 'liters', 'ml', 'cups', 'tbsp', 'tsp', 'dozen'];

  // T3 Build the entire recipe form with validation so users get instant feedback.
  readonly form: FormGroup = this.fb.group({
    recipeId: this.fb.control('', {
      validators: [Validators.required, Validators.pattern(/^R-\d{5}$/)]
    }),
    title: this.fb.control('', {
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(100)]
    }),
    chef: this.fb.control('', {
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(50)]
    }),
    mealType: this.fb.control('', { validators: [Validators.required] }),
    cuisineType: this.fb.control('', { validators: [Validators.required] }),
    difficulty: this.fb.control('', { validators: [Validators.required] }),
    prepTime: this.fb.control(30, {
      validators: [Validators.required, Validators.min(1), Validators.max(480)]
    }),
    servings: this.fb.control(1, {
      validators: [Validators.required, Validators.min(1), Validators.max(20)]
    }),
    createdDate: this.fb.control(this.today(), { validators: [Validators.required] }),
    ingredients: this.fb.array([this.buildIngredientGroup()]) as FormArray<FormGroup<IngredientForm>>,
    instructions: this.fb.array([this.buildInstructionControl()]) as FormArray<FormControl<string>>
  });

  ngOnChanges(changes: SimpleChanges): void {
    // T3 Whenever a new recipe is provided, populate the form with its details.
    if (changes['initialRecipe']) {
      this.populateForm(this.initialRecipe);
    }
  }

  // T3 Helper getters keep the template cleaner when looping over dynamic controls.
  get ingredientsArray(): FormArray<FormGroup<IngredientForm>> {
    return this.form.get('ingredients') as FormArray<FormGroup<IngredientForm>>;
  }

  get instructionsArray(): FormArray<FormControl<string>> {
    return this.form.get('instructions') as FormArray<FormControl<string>>;
  }

  addIngredient(): void {
    // T3 Let chefs add as many ingredients as needed with consistent validation.
    this.ingredientsArray.push(this.buildIngredientGroup());
  }

  removeIngredient(index: number): void {
    if (this.ingredientsArray.length > 1) {
      this.ingredientsArray.removeAt(index);
    }
  }

  addInstruction(): void {
    // T3 Support multiple step-by-step instructions for clear cooking guidance.
    this.instructionsArray.push(this.buildInstructionControl());
  }

  removeInstruction(index: number): void {
    if (this.instructionsArray.length > 1) {
      this.instructionsArray.removeAt(index);
    }
  }

  submit(): void {
    // T3 Validate the form, sanitize the values, and emit them to parent components.
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const createdDateInput = typeof raw.createdDate === 'string' ? raw.createdDate : this.today();
    const value: RecipeFormValue = {
      recipeId: String(raw.recipeId || '').trim().toUpperCase(),
      title: String(raw.title || '').trim(),
      chef: String(raw.chef || '').trim(),
      mealType: String(raw.mealType || '').trim(),
      cuisineType: String(raw.cuisineType || '').trim(),
      difficulty: String(raw.difficulty || '').trim(),
      prepTime: Number(raw.prepTime),
      servings: Number(raw.servings),
      createdDate: this.toIsoDateString(createdDateInput),
      ingredients: this.ingredientsArray.controls.map((group) => ({
        ingredientName: String(group.value.ingredientName || '').trim(),
        quantity: Number(group.value.quantity || 0),
        unit: String(group.value.unit || '').trim().toLowerCase()
      })),
      instructions: this.instructionsArray.controls
        .map((control) => String(control.value || '').trim())
        .filter((step) => step.length > 0)
    };

    this.submitted.emit(value);
  }

  trackByIndex(index: number): number {
    return index;
  }

  private populateForm(recipe: Recipe | null): void {
    // T3 Reset to defaults when creating or fill in existing fields when editing.
    if (!recipe) {
      this.resetForm();
      return;
    }

    this.form.patchValue({
      recipeId: recipe.recipeId,
      title: recipe.title,
      chef: recipe.chef,
      mealType: recipe.mealType,
      cuisineType: recipe.cuisineType,
      difficulty: recipe.difficulty,
      prepTime: recipe.prepTime,
      servings: recipe.servings,
      createdDate: this.toInputDate(recipe.createdDate)
    });

    this.setIngredients(recipe.ingredients || []);
    this.setInstructions(recipe.instructions || []);
  }

  private resetForm(): void {
    // T3 Clear the form and ensure at least one ingredient and instruction are present.
    this.form.reset({
      recipeId: '',
      title: '',
      chef: '',
      mealType: '',
      cuisineType: '',
      difficulty: '',
      prepTime: 30,
      servings: 1,
      createdDate: this.today()
    });
    this.setIngredients([]);
    this.setInstructions([]);
  }

  private setIngredients(ingredients: Recipe['ingredients']): void {
    // T3 Recreate the ingredient controls from saved data so users can tweak them.
    this.ingredientsArray.clear();
    if (!ingredients || !ingredients.length) {
      this.ingredientsArray.push(this.buildIngredientGroup());
      return;
    }
    for (const ingredient of ingredients) {
      this.ingredientsArray.push(this.buildIngredientGroup(ingredient));
    }
  }

  private setInstructions(instructions: string[]): void {
    // T3 Load each instruction step or provide a blank one if none exist yet.
    this.instructionsArray.clear();
    if (!instructions || !instructions.length) {
      this.instructionsArray.push(this.buildInstructionControl());
      return;
    }
    for (const step of instructions) {
      this.instructionsArray.push(this.buildInstructionControl(step));
    }
  }

  private buildIngredientGroup(initial?: RecipeIngredient): FormGroup<IngredientForm> {
    // T3 Create ingredient controls with validation to capture names, quantities, and units.
    return this.fb.group({
      ingredientName: this.fb.control(initial?.ingredientName || '', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2), Validators.maxLength(50)]
      }),
      quantity: this.fb.control<number | null>(initial?.quantity ?? null, {
        validators: [Validators.required, Validators.min(0.01), Validators.max(9999)]
      }),
      unit: this.fb.control(initial?.unit || '', {
        nonNullable: true,
        validators: [Validators.required]
      })
    });
  }

  private buildInstructionControl(value = ''): FormControl<string> {
    // T3 Ensure each instruction step is descriptive enough to follow easily.
    return this.fb.control(value, {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10), Validators.maxLength(500)]
    });
  }

  private today(): string {
    // T3 Provide a default date string formatted for HTML date inputs.
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private toInputDate(value: string): string {
    // T3 Convert stored ISO dates into the browser-friendly YYYY-MM-DD format.
    if (!value) {
      return this.today();
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return this.today();
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private toIsoDateString(value: string): string {
    // T3 Normalize date input back into ISO format so the API receives consistent values.
    const trimmed = (value || '').trim();
    if (trimmed) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
      if (match) {
        const year = Number(match[1]);
        const month = Number(match[2]) - 1;
        const day = Number(match[3]);
        const localDate = new Date(year, month, day);
        return localDate.toISOString();
      }
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    return new Date().toISOString();
  }
}
