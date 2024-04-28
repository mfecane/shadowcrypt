<template>
    <div class="hero">
        <div class="container">
            <div class="logo-wrapper">
                <Logo class="hero-logo" />
            </div>
            <h1>
                Get inspired for your artistic projects
            </h1>
            <h2>
                Build and organize your visual reference library
            </h2>
            <div class="buttons">
                <router-link class="btn call-to-action" to="/signup">
                    Start your library
                    <Icon :type="IconType.back" />
                </router-link>
                <router-link class="btn signin" to="/signin">
                    Sign in
                    <Icon :type="IconType.person" :size="1.0" />
                </router-link>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

import { RouterLink } from 'vue-router';

import Logo from '../common/Logo.vue';
import Icon from '../common/icons/Icon.vue';

import { IconType } from '../common/icons/IconType';

</script>

<style scoped lang="scss">
.hero {
    height: 560px;
    min-height: 100vh;
    position: relative;
    background-image: url(/assets/images/goblin_merged.png), url(/assets/images/goblin_merged.jpg);

    background-repeat: no-repeat;
    background-size: cover;
    background-position-x: center;
    background-position-y: center;

    @media (max-aspect-ratio: 2/3) {
        background-position-x: 65%;
    }
}

.logo-wrapper {
    display: flex;
    justify-content: space-between;
    align-self: stretch;
    align-items: center;
}

.hero .container {
    height: 100%;
    padding: 48px 40px 18vh 40px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
}

.hero-logo {
    margin-bottom: auto;
}

.hero h1 {
    margin-top: auto;
    font-size: 3rem;
    font-weight: 500;
    color: var(--accent-color);
    margin-bottom: 0.8rem;
    line-height: 4rem;
    max-width: 560px;
}

.hero h2 {
    font-size: 1.8rem;
    line-height: 2.7rem;
    font-weight: 500;
    color: var(--color-light);
    margin-bottom: 2.5rem;
    max-width: 500px;
}

.buttons {
    display: flex;

    &>*:not(:first-child) {
        margin-left: 24px;
    }
}

.btn.call-to-action,
.btn.signin {
    font-size: 1.2rem;
    padding: 8px 32px;

    display: flex;
    align-items: center;
}

.btn.call-to-action {
    color: var(--color-dark);
    background-color: var(--accent-color);
    border: 1px solid transparent;

    min-width: 240px;

    &:hover {
        background-color: white;
    }

    :deep(.icon) {
        margin-left: 0.5rem;
        transform: rotate(180deg);
    }

    :deep(.icon path) {
        fill: var(--color-dark);
    }
}

.btn.signin {
    color: var(--accent-color);
    background-color: rgba(0, 0, 0, 0.4);
    border: 1px solid var(--accent-color-dim);

    &:hover {
        background-color: rgba(55, 56, 58, 0.3);
        color: white;
    }

    :deep(.icon) {
        margin-left: 0.5rem;
    }

    & :deep(.icon path) {
        fill: var(--accent-color);
    }
}
</style>
