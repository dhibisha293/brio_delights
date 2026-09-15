-- Run this in the Supabase SQL editor (safe to run more than once).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  bakery_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  quantity numeric not null check (quantity > 0),
  unit text not null,
  cost numeric not null check (cost >= 0),
  purchased_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  selling_price numeric check (selling_price is null or selling_price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  name text not null,
  quantity numeric not null check (quantity > 0),
  unit text not null
);

create index if not exists pantry_items_user_id_idx on public.pantry_items (user_id);
create index if not exists recipes_user_id_idx on public.recipes (user_id);
create index if not exists recipe_ingredients_recipe_id_idx on public.recipe_ingredients (recipe_id);

alter table public.profiles enable row level security;
alter table public.pantry_items enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;

drop policy if exists "backend_all" on public.profiles;
create policy "backend_all"
  on public.profiles
  for all
  using (true)
  with check (true);

drop policy if exists "backend_all" on public.pantry_items;
create policy "backend_all"
  on public.pantry_items
  for all
  using (true)
  with check (true);

drop policy if exists "backend_all" on public.recipes;
create policy "backend_all"
  on public.recipes
  for all
  using (true)
  with check (true);

drop policy if exists "backend_all" on public.recipe_ingredients;
create policy "backend_all"
  on public.recipe_ingredients
  for all
  using (true)
  with check (true);

notify pgrst, 'reload schema';

-- --------------------------------------------------------
-- NEW PANTRY MODULE: Ingredients and Purchases
-- --------------------------------------------------------

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null,
  unit text not null,
  minimum_stock numeric not null check (minimum_stock >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ingredient_purchases (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  shop_name text not null,
  purchase_date date not null default current_date,
  quantity numeric not null check (quantity > 0),
  remaining_quantity numeric not null check (remaining_quantity >= 0),
  price numeric not null check (price >= 0),
  expiry_date date,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists ingredients_user_id_idx on public.ingredients (user_id);
create index if not exists purchases_ingredient_id_idx on public.ingredient_purchases (ingredient_id);
create index if not exists purchases_user_id_idx on public.ingredient_purchases (user_id);

alter table public.ingredients enable row level security;
alter table public.ingredient_purchases enable row level security;

drop policy if exists "ingredients_user_all" on public.ingredients;
create policy "ingredients_user_all"
  on public.ingredients
  for all
  using (true)
  with check (true);

drop policy if exists "purchases_user_all" on public.ingredient_purchases;
create policy "purchases_user_all"
  on public.ingredient_purchases
  for all
  using (true)
  with check (true);

notify pgrst, 'reload schema';

-- --------------------------------------------------------
-- UPDATE PANTRY MODULE: Opening Stock & Nullable quantities
-- --------------------------------------------------------

alter table public.ingredient_purchases alter column quantity drop not null;
alter table public.ingredient_purchases alter column remaining_quantity drop not null;
alter table public.ingredient_purchases alter column price drop not null;
alter table public.ingredient_purchases alter column shop_name drop not null;

alter table public.ingredient_purchases drop constraint if exists ingredient_purchases_quantity_check;
alter table public.ingredient_purchases drop constraint if exists ingredient_purchases_remaining_quantity_check;
alter table public.ingredient_purchases drop constraint if exists ingredient_purchases_price_check;

alter table public.ingredient_purchases add constraint ingredient_purchases_quantity_check check (quantity is null or quantity > 0);
alter table public.ingredient_purchases add constraint ingredient_purchases_remaining_quantity_check check (remaining_quantity is null or remaining_quantity >= 0);
alter table public.ingredient_purchases add constraint ingredient_purchases_price_check check (price is null or price >= 0);

alter table public.ingredient_purchases add column if not exists is_opening_stock boolean not null default false;

notify pgrst, 'reload schema';


-- UPDATE RECIPES MODULE
-- --------------------------------------------------------

alter table public.recipes add column if not exists category text not null default 'Other';
alter table public.recipes add column if not exists description text;
alter table public.recipes add column if not exists notes text;
alter table public.recipes add column if not exists updated_at timestamptz not null default now();

-- We need to drop the existing table entirely or clean it up if it has the wrong columns.
-- Since they just ran it and there's no data probably, we can just alter it.
-- But wait, SQLite syntax vs Postgres syntax... This is postgres.
-- Instead of complex alters, let's just drop and recreate recipe_ingredients since it has dummy data if any.
drop table if exists public.recipe_ingredients cascade;

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  quantity numeric not null check (quantity > 0),
  unit text not null,
  created_at timestamptz not null default now(),
  unique (recipe_id, ingredient_id)
);

notify pgrst, 'reload schema';

