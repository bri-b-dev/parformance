<template>
  <div>
    <div class="row">
      <div class="field" style="min-width:180px;">
        <label class="label">Kategorie</label>
        <select v-model="filterCategory" class="input">
          <option value="">Alle</option>
          <option value="chipping">Chipping</option>
          <option value="putting">Putting</option>
          <option value="driving">Driving</option>
          <option value="irons">Irons</option>
          <option value="bunker">Bunker</option>
        </select>
      </div>
    </div>


    <div class="row">
      <article class="card" v-for="d in filtered" :key="d.id" style="flex:1 1 280px;">
        <header style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <RouterLink :to="`/drills/${d.id}`" style="font-weight:700; text-decoration:none; color:inherit">{{
              d.title
            }}
          </RouterLink>
          <small class="chip">★ {{ d.difficulty ?? 3 }}</small>
        </header>
        <p style="color:var(--muted); margin:.5rem 0 0">{{ d.category }}</p>
        <p v-if="d.description" style="margin:.5rem 0 0">{{ d.description }}</p>
        <div v-if="d.tags?.length" class="chips" style="margin-top:8px;">
          <span class="chip" v-for="t in d.tags" :key="t">{{ t }}</span>
        </div>
        <hr class="hr"/>
        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <RouterLink class="btn" :to="`/drills/${d.id}`">Bearbeiten</RouterLink>
          <button class="btn" @click="del(d.id)">Löschen</button>
        </div>
      </article>
    </div>


    <div style="margin-top:16px;">
      <RouterLink class="btn btn-primary" to="/drills/new">Neues Spiel</RouterLink>
    </div>
  </div>
</template>