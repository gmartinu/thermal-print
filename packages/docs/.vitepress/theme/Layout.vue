<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import HeroVideo from "./components/HeroVideo.vue";
import TypeWriter from "./components/TypeWriter.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #home-hero-info>
      <h1 class="name">
        <span class="clip">@thermal-print</span>
      </h1>
      <p class="text">Thermal Printing for <br /><TypeWriter /></p>
      <p class="tagline">
        A modular TypeScript library suite for thermal printing with clean,
        standalone architecture.
      </p>
      <div class="actions">
        <a class="action brand" href="/thermal-print/guide/getting-started"
          >Get Started</a
        >
        <a
          class="action alt"
          href="https://gmartinu.github.io/thermal-print/playground/"
          target="_blank"
          >Try Playground</a
        >
        <a
          class="action alt"
          href="https://github.com/gmartinu/thermal-print"
          target="_blank"
          >View on GitHub</a
        >
      </div>
    </template>
    <template #home-hero-image>
      <HeroVideo />
    </template>
  </Layout>
</template>

<style scoped>
.name {
  font-size: 3rem;
  font-weight: 700;
  line-height: 1.2;
}

.name .clip {
  background: var(--vp-c-brand-3);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}


.text {
  font-size: 3rem;
  font-weight: 700;
  line-height: 1.2;
  margin-top: 0.5rem;
}

.tagline {
  font-size: 1.25rem;
  color: var(--vp-c-text-2);
  margin-top: 1rem;
  max-width: 500px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.action {
  display: inline-block;
  padding: 0.625rem 1.25rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}

.action.brand {
  background-color: var(--vp-c-brand-3);
  color: var(--vp-c-white);
}

.action.brand:hover {
  background-color: var(--vp-c-brand-1);
}


.action.alt {
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.action.alt:hover {
  border-color: var(--vp-c-brand-3);
  color: var(--vp-c-brand-3);
}


@media (max-width: 768px) {
  .name,
  .text {
    font-size: 2rem;
  }

  .tagline {
    font-size: 1rem;
  }
}
</style>

<style>
/* Dark mode overrides - must be unscoped */
html.dark .name .clip {
  background: var(--vp-c-brand-1);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

html.dark .action.brand {
  background-color: var(--vp-c-brand-1);
}

html.dark .action.brand:hover {
  background-color: var(--vp-c-brand-2);
}

html.dark .action.alt:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
</style>
