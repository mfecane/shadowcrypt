<template>
    <Hero />
    <div class="container descr">
        <p>
            ArtRefCollect is a specialized platform designed to cater to the needs of artists by providing a user-friendly
            and efficient solution for collecting and storing reference images. Whether you're an illustrator, painter,
            sculptor, or any other type of visual artist, ArtRefCollect aims to streamline your creative process by offering
            a centralized hub for managing and organizing your reference materials.
        </p>
        <h2>Key Features:</h2>
        <ul>
            <li>
                <h3>Intuitive Image Collection:</h3>

                Effortlessly collect and organize reference images based on themes, categories, or projects.
                User-friendly interface for easy navigation and management of your image library.
                Robust Search Functionality:
            </li>

            <li>
                <h3>Robust Search Functionality:</h3>

                Advanced search options to quickly find specific reference images.
                Filter images by tags, colors, or content to tailor your search results.
            </li>

            <li>
                <h3>Cloud Storage:</h3>

                Securely store your reference images in the cloud for easy access from any device.
                Unlimited storage space to accommodate your growing collection.
            </li>

            <li>
                <h3>Tagging and Annotation:</h3>

                Add custom tags and annotations to your images for detailed organization.
                Mark key points or elements in an image for quick reference during the creative process.
            </li>

            <li>
                <h3>Privacy Controls:</h3>

                Choose between public and private settings for your reference boards.
                Maintain control over who can view and interact with your collection.
            </li>

            <li>
                <h3>Mobile Accessibility:</h3>

                Access your reference images on the go with a mobile-friendly interface.
                Capture and upload images directly from your mobile device.
            </li>

            <li>
                <h3>Offline Mode:</h3>

                Download reference images for offline use when an internet connection is not available.
                Ensure uninterrupted access to your references during your creative sessions.
            </li>

            <li>
                <h3>Community Features:</h3>

                Connect with a community of artists to share insights, tips, and inspiration.
                Participate in challenges or themed events to spark creativity.
            </li>

            <li>
                <h3>Regular Updates and Support:</h3>

                Receive updates with new features and improvements to enhance your experience.
                Responsive customer support to address any queries or issues promptly.
            </li>
        </ul>
    </div>
</template>
  
<script setup lang="ts">

import { useRouter } from 'vue-router';

import { useAuth } from '@/hooks/useAuth';
import { storeToRefs } from 'pinia';
import { watch } from 'vue';
import Hero from './Hero.vue';

const router = useRouter()
const { user } = storeToRefs(useAuth())

watch(user, (user) => {
    if (user) {
        router.push('/list')
    }
})

</script>
  
<style scoped lang="scss">
.descr {
    color: var(--color-light);
    padding-top: 60px;
    padding-bottom: 100px;
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
</style>
