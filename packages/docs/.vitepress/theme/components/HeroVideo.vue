<script setup lang="ts">
import { withBase } from 'vitepress'
</script>

<template>
  <div class="hero-video-wrapper">
    <img
      class="hero-video"
      :src="withBase('/demo.webp')"
      alt="thermal-print demo"
    />
  </div>
</template>

<style scoped>
.hero-video-wrapper {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 20px 40px rgba(92, 45, 139, 0.2),
    0 0 0 1px rgba(0, 147, 183, 0.1);
  animation: float 6s ease-in-out infinite;
}

.hero-video-wrapper::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, #0093B7, #5C2D8B, #0093B7);
  background-size: 200% 200%;
  animation: gradientShift 4s ease infinite;
  border-radius: 18px;
  z-index: -1;
}

.hero-video {
  display: block;
  width: 100%;
  max-width: 550px;
  height: auto;
  border-radius: 14px;
  background: var(--vp-c-bg);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@media (max-width: 768px) {
  .hero-video-wrapper {
    animation: none;
  }

  .hero-video {
    max-width: 400px;
  }
}

@media (max-width: 480px) {
  .hero-video {
    max-width: 300px;
  }
}
</style>

<style>
/* Dark mode overrides - must be unscoped */
html.dark .hero-video-wrapper {
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(0, 184, 224, 0.2);
}

html.dark .hero-video-wrapper::before {
  background: linear-gradient(135deg, #00b8e0, #9b6dcc, #00b8e0);
}
</style>
