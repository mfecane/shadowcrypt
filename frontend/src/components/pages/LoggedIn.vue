<template>
    <DragWrapper>
        <div class='content'>
            <slot></slot>
        </div>
        <CreateButton />
        <DialogRoot />
    </DragWrapper>
    <Create v-if="user?.id" />
    <Quickfind />
</template>

<script setup lang="ts">

import Create from '@/components/create/Create.vue'
import CreateButton from '@/components/common/CreateButton.vue'
import DragWrapper from '@/components/drag/DragWrapper.vue'
import DialogRoot from '@/components/dialogs/DialogRoot.vue'
import Quickfind from '@/components/quickfind/Quickfind.vue'

import { storeToRefs } from 'pinia';

import { useAuth } from '@/hooks/useAuth';
import { listenPaste } from '@/hooks/useUploadDialog'

const { user } = storeToRefs(useAuth())

listenPaste()

</script>

<style scoped lang="scss"></style>
