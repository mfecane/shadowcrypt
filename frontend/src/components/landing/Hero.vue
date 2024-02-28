<template>
    <div class="hero">
        <div class="container">
            <Logo class="hero-logo" />
            <h1>Fuel Your Artistic Vision</h1>
            <h2>Seamlessly collect and store reference images</h2>
            <router-link class="btn call-to-action" to="/signup">
                Start building your library
                <Icon :type="IconType.back" />
            </router-link>

        </div>
    </div>
</template>
  
<script setup lang="ts">

import { storeToRefs } from 'pinia';
import { watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import Logo from '../common/Logo.vue';
import Icon from '../common/icons/Icon.vue';

import { useAuth } from '@/hooks/useAuth';
import { IconType } from '../common/icons/IconType';

const router = useRouter()
const { user } = storeToRefs(useAuth())

watch(user, (user) => {
    if (user) {
        router.push('/list')
    }
})

</script>
  
<style scoped lang="scss">
.hero {
    height: 500px;
    min-height: 60vmin;
    position: relative;
    background: url(/assets/images/goblin.png) no-repeat;
    background-size: cover;
    background-position-x: center;
    background-position-y: center;

    @media (max-aspect-ratio: 2/3) {
        background-position-x: 65%;
    }
}

.hero .container {
    height: 100%;
    padding-top: 60px;
    padding-bottom: 50px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
}

.hero-logo {
    margin-bottom: auto;
}

.hero h1 {
    font-size: 3rem;
    font-weight: 500;
    color: var(--accent-color);
    margin-bottom: 0.5rem;
    line-height: 3.5rem;
    max-width: 500px;
}

.hero h2 {
    font-size: 2rem;
    font-weight: 500;
    color: var(--color-light);
    margin-bottom: 2.5rem;
    max-width: 500px;
}

.hero .btn {
    padding: 8px 32px;
}

.call-to-action {
    font-size: 1.2rem;
    display: flex;

    & :deep(.icon) {
        transform: rotate(180deg);
        margin-left: 0.5rem;
    }

    & :deep(.icon path) {
        fill: var(--color-dark);
    }
}
</style>
