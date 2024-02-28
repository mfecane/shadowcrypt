
<template>
    <div class="user" v-click-outside-element="closeOptions">
        <a href="#" @click.prevent="showMenu = true">
            <img :src="gravatar" alt="" />
            <Icon :type="IconType.back" :size="1.2" />
        </a>
        <UserMenu v-if="showMenu" @onClose="showMenu = false" />
    </div>
</template>
  
<script setup lang="ts">

import UserMenu from './UserMenu.vue'
import Icon from '@/components/common/icons/Icon.vue'

import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia';
import md5 from 'md5'

import { useAuth } from '@/hooks/useAuth'
import { IconType } from '../common/icons/IconType';

const auth = useAuth()

const { user } = storeToRefs(auth)

const showMenu = ref<boolean>(false)

onMounted(() => showMenu.value = false)

const gravatar = computed(() => {
    const hash = md5(user.value!.email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}`;
})

function closeOptions() {
    showMenu.value = false
}

</script>
  
<style scoped lang="scss">
.user2 {
    display: flex;

    &>* {
        margin-left: 8px;
    }
}

.user {
    position: relative;

    a {
        display: flex;
        border-radius: 999px;
        background-color: var(--accent-color);
        height: 46px;
        align-items: center;
        padding: 5px;

        img {
            width: 38px;
            height: 38px;
            object-fit: cover;
            border-radius: 999px;
        }

        :deep(svg) {
            transform: rotate(-90deg);
            margin: 8px 8px 8px 12px;

            path {
                fill: var(--color-dark)
            }
        }

        &:hover :deep(svg) {
            path {
                fill: black
            }
        }
    }
}
</style>
