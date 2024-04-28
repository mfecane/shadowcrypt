<template>
    <Hero />
    <div class="container descr">
        <div class="columns">
            <div>
                <h3>
                    Build
                </h3>
                <p>
                    Save images to your collection by dragging and dropping or copying and pasting them.
                </p>
            </div>
            <img src="/assets/images/cat.png" alt="">
        </div>

        <div class="columns organize">
            <div>
                <h3>
                    Organize
                </h3>
                <p>
                    Organize your collections by groups
                    Pin any collection for quick access
                </p>
            </div>
            <img src="/assets/images/cat.png" alt="">
        </div>

        <div class="columns">
            <div>
                <h3>
                    Share
                </h3>
                <p>
                    Organize your collections by groups
                    Pin any collection for quick access
                </p>
            </div>
            <img src="/assets/images/cat.png" alt="">
        </div>

        <div class="collect">
            <router-link class="btn signin" to="/signin">
                Start building you library
                <Icon :type="IconType.back" :size="1.0" />
            </router-link>
        </div>

    </div>
    <Support />
</template>

<script setup lang="ts">

import Support from '@/components/landing/Support.vue';
import Icon from '../common/icons/Icon.vue';
import { RouterLink } from 'vue-router';

import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { watch } from 'vue';

import { useAuth } from '@/hooks/useAuth';
import Hero from './Hero.vue';
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
.columns {
    display: flex;

    :first-child {
        flex: 1 1 40%;
    }

    &:not(:first-child) {
        margin-top: 40px;
    }

    h3 {
        font-size: 2.8rem;
        color: var(--accent-color);
    }

    p {
        margin-top: 18px;
        font-size: 22px;
    }

    img {
        flex: 1 1 60%;
        min-width: 0;
    }

    &>*:not(:first-child) {
        margin-left: 16px;
    }

    @media (max-width: 800px) {
        display: block;
    }
}

.organize {
    flex-flow: row-reverse;
}

.descr.container {
    padding: 80px 40px 100px 40px;
}

.descr {
    color: var(--color-light);
    font-size: 1.2rem;
    line-height: 2.2rem;
    font-weight: normal;

    p,
    li {
        margin: 20px 0;

        h3 {
            margin-bottom: 1.2rem;
            font-weight: 500;
            font-size: 1.3rem
        }
    }

    h2 {
        font-size: 2rem;
        font-weight: 500;
    }
}

.collect {
    padding: 40px 0;

    :deep(a) {
        font-size: 18px;
        padding: 8px 32px;
        width: max-content;
        margin: auto;
    }

    :deep(.icon) {
        margin-left: 0.5rem;
        transform: rotate(180deg);
    }
}
</style>
