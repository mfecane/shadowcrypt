<template>
    <div class="loader" :class="props.size">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 81.3 85.88">
            <path class="door"
                d="M40,22.94c-10.22.34-18.18,9.07-18.18,19.3v28.56c0,3.28,2.66,5.95,5.95,5.95h25.75c3.28,0,5.95-2.66,5.95-5.95v-29.05c0-10.61-8.78-19.17-19.47-18.81Z" />
            <path
                d="M43.16.08c-11.34-.68-22.13,3.21-30.37,10.97C4.66,18.7,0,29.49,0,40.65v39.23c0,3.31,2.69,6,6,6s6-2.69,6-6v-39.23c0-7.98,3.2-15.39,9.02-20.86,5.81-5.47,13.42-8.22,21.42-7.73,14.56.88,26.86,14.26,26.86,29.22v38.6c0,3.31,2.69,6,6,6s6-2.69,6-6v-38.6C81.3,19.83,64.19,1.35,43.16.08Z" />
        </svg>
        <span v-if="props.caption">Loading...</span>
    </div>
</template>

<script setup lang="ts">

const props = withDefaults(defineProps<{ size: 'small' | 'medium' | 'large', caption: boolean }>(), { size: 'medium', caption: false })

</script>

<style scoped lang="scss">
.loader {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.loader svg {
    width: 42px;
    height: 42px;

    path {
        fill: var(--accent-color)
    }
}

.loader.large svg {
    width: 64px;
    height: 64px;
}

.loader .door {
    animation: pulse 1s infinite ease-in-out;
    transform-origin: 50% 0;
}

@keyframes pulse {
    0% {
        transform: scaleX(1);
    }

    50% {

        transform: scaleX(0);
    }

    100% {
        transform: scaleX(1);
    }
}

.loader span {
    margin-top: 16px;
    font-size: 2rem;
    color: var(--accent-color)
}
</style>