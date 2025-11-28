<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const words = ["React", "Node", "Vue"];
const currentWord = ref("");
const wordIndex = ref(0);
const isDeleting = ref(false);

let timeout: ReturnType<typeof setTimeout> | null = null;

const typeSpeed = 100;
const deleteSpeed = 100;
const pauseTime = 750;

function type() {
  const fullWord = words[wordIndex.value];

  if (isDeleting.value) {
    currentWord.value = fullWord.substring(0, currentWord.value.length - 1);
  } else {
    currentWord.value = fullWord.substring(0, currentWord.value.length + 1);
  }

  let delay = isDeleting.value ? deleteSpeed : typeSpeed;

  if (!isDeleting.value && currentWord.value === fullWord) {
    delay = pauseTime;
    isDeleting.value = true;
  } else if (isDeleting.value && currentWord.value === "") {
    isDeleting.value = false;
    wordIndex.value = (wordIndex.value + 1) % words.length;
    delay = 500;
  }

  timeout = setTimeout(type, delay);
}

onMounted(() => {
  type();
});

onUnmounted(() => {
  if (timeout) clearTimeout(timeout);
});
</script>

<template>
  <span class="typewriter">
    <span class="typed-text">{{ currentWord }}</span>
    <span class="cursor">|</span>
  </span>
</template>

<style scoped>
.typewriter {
  display: inline;
}

.typed-text {
  color: var(--vp-c-brand-3);
}

.cursor {
  color: var(--vp-c-brand-3);
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}
</style>

<style>
/* Dark mode overrides - must be unscoped */
html.dark .typed-text,
html.dark .cursor {
  color: var(--vp-c-brand-1);
}
</style>
